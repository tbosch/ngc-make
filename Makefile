# TODO: How to simplify these rules??

COMMON_INPUT_DIRS=../node_modules/@angular/core,../node_modules/rxjs

all: dist/mod1/*.d.ts dist/mod2/*.d.ts

clean:
	rm -fr dist/*
	rm -fr src/mod1/*.ngfactory.ts
	rm -fr src/mod2/*.ngfactory.ts

dist/mod1/%.metadata.json dist/mod1/%.d.ts dist/mod1/%.js: src/mod1/*.ts
	node ./ngc/main.js -p src/tsconfig.json --inputDirs mod1,gen/mod1,$(COMMON_INPUT_DIRS)

dist/mod2/%.metadata.json dist/mod2/%.d.ts dist/mod2/%.js: src/mod2/*.ts dist/mod1/*.d.ts
	node ./ngc/main.js -p src/tsconfig.json --inputDirs mod2,gen/mod2,../dist/mod1,$(COMMON_INPUT_DIRS)
