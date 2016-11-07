# Restriction: all input dirs are non recursive!!

DIST_DIR=$(abspath dist)/\*\*
COMMON_INPUT_DIRS=./node_modules/@angular/core/* ./node_modules/rxjs/*

# Note: need to escape the * so that bash does not expand it
sortedfolders = $(addsuffix /\*\*,$(abspath $(sort $(dir $(1)))))

ngfactoryinputs = $(subst src/,srcgen/,$(1))

MOD1_SRC=src/mod1/*.ts
# TODO: Calculate this via a tool!
MOD1_DEPS=$(COMMON_INPUT_DIRS)

MOD2_SRC=src/mod2/*.ts
# TODO: Calculate this via a tool!
MOD2_DEPS=dist/mod1/*.d.ts $(COMMON_INPUT_DIRS)

all: dist/mod1/*.d.ts dist/mod2/*.d.ts

clean:
	rm -fr dist/*
	rm -fr srcgen/*.ts
	rm -fr srcgen/*/*

dist/mod1/%.d.ts dist/mod1/%.js: $(MOD1_SRC) $(MOD1_DEPS)
	node ./ngc/client.js -p src/tsconfig.json --strictInputs $(call sortedfolders,$?) $(DIST_DIR)
	node ./ngc/client.js -p srcgen/tsconfig.json --strictInputs $(call ngfactoryinputs,$(call sortedfolders,$?)) $(DIST_DIR)

dist/mod2/%.d.ts dist/mod2/%.js: $(MOD2_SRC) $(MOD2_DEPS)
	node ./ngc/client.js -p src/tsconfig.json --strictInputs $(call sortedfolders,$?) $(DIST_DIR)
	node ./ngc/client.js -p srcgen/tsconfig.json --strictInputs $(call ngfactoryinputs,$(call sortedfolders,$?)) $(DIST_DIR)
