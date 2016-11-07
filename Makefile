# Restriction: all input dirs are non recursive!!
# Restriction: filter lists by starting path!!

COMMON_INPUT_DIRS=./node_modules/@angular/core/* ./node_modules/rxjs/*

# Note: need to escape the * so that bash does not expand it
sortedfolders = $(addsuffix /\*\*,$(abspath $(sort $(dir $(1)))))

# TODO: exclude .ngfactory.d.ts files from dist folder that corresponds to
# the src folder.
ngfactoryinputs = $(sort $(subst src/,srcgen/,$(1)) $(subst src/,dist/,$(1)))

MOD1_SRC=src/mod1/*.ts
MOD1_DEPS=$(COMMON_INPUT_DIRS)

MOD2_SRC=src/mod2/*.ts
MOD2_DEPS=dist/mod1/*.d.ts $(COMMON_INPUT_DIRS)

all: dist/mod1/*.d.ts dist/mod2/*.d.ts

clean:
	rm -fr dist/*
	rm -fr srcgen/*.ts
	rm -fr srcgen/*/*

dist/mod1/%.metadata.json dist/mod1/%.d.ts dist/mod1/%.js: $(MOD1_SRC) $(MOD1_DEPS)
	node ./ngc/client.js -p src/tsconfig.json --strictInputs $(call sortedfolders,$?)
	node ./ngc/client.js -p srcgen/tsconfig.json --strictInputs $(call ngfactoryinputs,$(call sortedfolders,$?))

dist/mod2/%.metadata.json dist/mod2/%.d.ts dist/mod2/%.js: $(MOD2_SRC) $(MOD2_DEPS)
	node ./ngc/client.js -p src/tsconfig.json --strictInputs $(call sortedfolders,$?)
	node ./ngc/client.js -p srcgen/tsconfig.json --strictInputs $(call ngfactoryinputs,$(call sortedfolders,$?))
