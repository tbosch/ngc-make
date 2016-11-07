TODO:
!! Transitive deps with make !!
- user has to define all of them as direct deps. Is there another way?
- we can help this with the summaries!
  * if the provider summary includes all the other summaries as well!
  * but: the compilation of the ngfactory.ts files will always need transitive
    knowledge? (at least for the providers for NgModules...)
	- only the transitive .d.ts files...
	--> compile ngfactory files with a separate rule that just compiles
	    all of them in one go? --> does not scale...
	--> or let the user define separate rules for the ngfactory files .d.ts / .js files for now
	    that depend on all deps .d.ts files transitively?

Try to add a single rule to compile the node_modules deps
  * e.g. use material
  * need to turn off generateCodeForLibraries in tsconfig for this...

Try to get a tsserver running while calling tsc during make multiple times...

------
Debate on Monday the usage of make!

Keep this use case in mind when implementing module summaries!
