# TODO: How to simplify these rules??

COMMON_INPUT_DIRS=../node_modules/@angular/core,../node_modules/rxjs

all: dist/mod1/*.d.ts dist/mod2/*.d.ts

clean:
	rm -fr dist/*
	rm -fr srcgen/*.ts
	rm -fr srcgen/*/*

dist/mod1/%.metadata.json dist/mod1/%.d.ts dist/mod1/%.js: src/mod1/*.ts
	node ./ngc/main.js -p src/tsconfig.json --inputDirs mod1,$(COMMON_INPUT_DIRS)
	# TODO: only allow the .d.ts files produced from src/mod1/*.ts, but not from ngfactory files,
	# otherwise we get a cycle!
	# -> need to pass `--inputFiles` instead of `--inputDirs` and set it to the
	#    make file prerequisites (via a variable!)
	node ./ngc/main.js -p srcgen/tsconfig.json --inputDirs mod1,../dist/mod1,$(COMMON_INPUT_DIRS)

dist/mod2/%.metadata.json dist/mod2/%.d.ts dist/mod2/%.js: src/mod2/*.ts dist/mod1/*.d.ts
	node ./ngc/main.js -p src/tsconfig.json --inputDirs mod2,../dist/mod1,$(COMMON_INPUT_DIRS)
	# TODO: only allow the .d.ts files produced from src/mod2/*.ts, but not from ngfactory files (see above)
	node ./ngc/main.js -p srcgen/tsconfig.json --inputDirs mod2,../dist/mod1,../dist/mod2,$(COMMON_INPUT_DIRS)
