TODO:
- why aren't the .ngfactory.ts files compiled into `dist` as well??
  * at least not on the initial run...
- try to add a single rule to compile the node_modules deps
  * e.g. use material
  * need to turn off generateCodeForLibraries in tsconfig for this...
- add a `clean` rule to the Makefile

Transitive deps with make:
- user has to define all of them as direct deps. Is there another way?
- if so, maybe

Try to get a tsserver running while calling tsc during make multiple times...

------
Debate on Monday the usage of make!

Keep this use case in mind when implementing module summaries!
