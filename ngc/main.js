"use strict";
require('reflect-metadata');
var fs = require('fs');
var path = require('path');
var ts = require('typescript');
var tsc_1 = require('@angular/tsc-wrapped/src/tsc');
var compiler_host_1 = require('@angular/tsc-wrapped/src/compiler_host');
var cli_options_1 = require('@angular/tsc-wrapped/src/cli_options');
var codegen_1 = require('@angular/compiler-cli/src/codegen');
var path_mapped_reflector_host_1 = require('@angular/compiler-cli/src/path_mapped_reflector_host');
var multimatch = require('multimatch');

function main(project, cliOptions, codegen) {
    try {
		var projectDir = project;
        if (fs.lstatSync(project).isFile()) {
            projectDir = path.dirname(project);
        }
        // file names in tsconfig are resolved relative to this absolute path
        var basePath = path.resolve(process.cwd(), cliOptions.basePath || projectDir);
        // read the configuration options from wherever you store them
        var _a = tsc_1.tsc.readConfiguration(project, basePath), parsed_1 = _a.parsed, ngOptions_1 = _a.ngOptions;
        ngOptions_1.basePath = basePath;
        var host_1 = ts.createCompilerHost(parsed_1.options, true);
        // HACK: patch the realpath to solve symlink issue here:
        // https://github.com/Microsoft/TypeScript/issues/9552
        // todo(misko): remove once facade symlinks are removed
        host_1.realpath = function (path) { return path; };

		// PATCH(tbosch): start, add strictInputs option
		var origFileExists = host_1.fileExists;
		host_1.fileExists = function(fileName) {
			if (cliOptions.strictInputs) {
				if (multimatch(fileName, cliOptions.strictInputs).length === 0) {
					return false;
				}
			}
			return origFileExists.apply(this, arguments);
		};
		parsed_1.fileNames = parsed_1.fileNames.filter( (fileName) => host_1.fileExists(fileName));
		// PATCH(tbosch): end

		var program_1 = ts.createProgram(parsed_1.fileNames, parsed_1.options, host_1);
        var errors = program_1.getOptionsDiagnostics();
        tsc_1.check(errors);
        if (ngOptions_1.skipTemplateCodegen || !codegen) {
            codegen = function () { return Promise.resolve(null); };
        }
        return codegen(ngOptions_1, cliOptions, program_1, host_1).then(function () {
            // Create a new program since codegen files were created after making the old program
            var newProgram = ts.createProgram(parsed_1.fileNames, parsed_1.options, host_1, program_1);
            tsc_1.tsc.typeCheck(host_1, newProgram);
            // Emit *.js with Decorators lowered to Annotations, and also *.js.map
            var tsicklePreProcessor = new compiler_host_1.TsickleHost(host_1, newProgram);
            tsc_1.tsc.emit(tsicklePreProcessor, newProgram);
            if (!ngOptions_1.skipMetadataEmit) {
                // Emit *.metadata.json and *.d.ts
                // Not in the same emit pass with above, because tsickle erases
                // decorators which we want to read or document.
                // Do this emit second since TypeScript will create missing directories for us
                // in the standard emit.
                var metadataWriter = new compiler_host_1.MetadataWriterHost(host_1, newProgram, ngOptions_1);
                tsc_1.tsc.emit(metadataWriter, newProgram);
            }
        });
    }
    catch (e) {
        return Promise.reject(e);
    }
}

// PATCH(tbosch): start
var IGNORED_FILES = /\.ngfactory\.js$|\.css\.js$|\.css\.shim\.js$/;
compiler_host_1.MetadataWriterHost.prototype.writeFile = function(fileName, data, writeByteOrderMark, onError, sourceFiles) {
	if (/\.d\.ts$/.test(fileName)) {
		// Let the original file be written first; this takes care of creating parent directories
		this.delegate.writeFile(fileName, data, writeByteOrderMark, onError, sourceFiles);
		// PATCH(tbosch): removed the early return
	}
	if (IGNORED_FILES.test(fileName)) {
		return;
	}
	if (!sourceFiles) {
		throw new Error('Metadata emit requires the sourceFiles are passed to WriteFileCallback. ' +
			'Update to TypeScript ^1.9.0-dev');
	}
	if (sourceFiles.length > 1) {
		throw new Error('Bundled emit with --out is not supported');
	}
	this.writeMetadata(fileName, sourceFiles[0]);
};
// PATCH(tbosch): end

// PATCH(tbosch): start
var EXT = /(\.ts|\.d\.ts|\.js|\.jsx|\.tsx)$/;
path_mapped_reflector_host_1.PathMappedReflectorHost.prototype.getImportPath = function (containingFile, importedFile) {
	var _this = this;
	importedFile = this.resolveAssetUrl(importedFile, containingFile);
	containingFile = this.resolveAssetUrl(containingFile, '');
	if (this.options.traceResolution) {
		console.log('getImportPath from containingFile', containingFile, 'to importedFile', importedFile);
	}
	// If a file does not yet exist (because we compile it later), we still need to
	// assume it exists so that the `resolve` method works!
	if (!this.context.fileExists(importedFile)) {
		if (this.options.rootDirs && this.options.rootDirs.length > 0) {
			this.context.assumeFileExists(path.join(this.options.rootDirs[0], importedFile));
		}
		else {
			this.context.assumeFileExists(importedFile);
		}
	}
	var resolvable = function (candidate) {
		// PATCH(tbosch): resolve candidate against containingFile, not the importedFile!
		var resolved = _this.getCanonicalFileName(_this.resolve(candidate, containingFile));
		return resolved && resolved.replace(EXT, '') === importedFile.replace(EXT, '');
	};
	var importModuleName = importedFile.replace(EXT, '');
	var parts = importModuleName.split(path.sep).filter(function (p) { return !!p; });
	var foundRelativeImport;
	for (var index = parts.length - 1; index >= 0; index--) {
		var candidate_1 = parts.slice(index, parts.length).join(path.sep);
		// PATCH(tbosch): prefer relative imports over absolute imports
		if (!foundRelativeImport && resolvable(candidate_1)) {
			return candidate_1;
		}
		candidate_1 = '.' + path.sep + candidate_1;
		if (resolvable(candidate_1)) {
			foundRelativeImport = candidate_1;
		}
	}
	if (foundRelativeImport) {
		return foundRelativeImport;
	}
	// Try a relative import
	var candidate = path.relative(path.dirname(containingFile), importModuleName);
	if (resolvable(candidate)) {
		return candidate;
	}
	throw new Error("Unable to find any resolvable import for " + importedFile + " relative to " + containingFile);
};
// PATCH(tbosch): end

function codegen(ngOptions, cliOptions, program, host) {
    return codegen_1.CodeGenerator.create(ngOptions, cliOptions, program, host).codegen({
        // PATCH(tbosch): turn off transitive module compilation
		transitiveModules: false
    });
}

exports.main = main;
// CLI entry point
if (require.main === module) {
    var args_1 = require('minimist')(process.argv.slice(2));
    var project = args_1.p || args_1.project || '.';
    var cliOptions = new cli_options_1.NgcCliOptions(args_1);
	// PATCH(tbosch): Added strictInputs
	cliOptions.strictInputs = args_1.strictInputs ? [args_1.strictInputs].concat(args_1._) : null;
    // PATCH(tbosch): Added codegen
	// main(project, cliOptions, codegen).then(function (exitCode) { return process.exit(exitCode); }).catch(function (e) {
	main(project, cliOptions, codegen).then(function (exitCode) { return process.exit(exitCode); }).catch(function (e) {
        console.error(e.stack);
        console.error('Compilation failed');
        process.exit(1);
    });
}
//# sourceMappingURL=main.js.map