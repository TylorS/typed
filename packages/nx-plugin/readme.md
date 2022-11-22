# @typed/nx-plugin

This is really only intended to generate new packages inside of the @typed/fx repo itself. 
However, you might find some use from copy/pasting and making your own changes to it.

At least with my setup using pnpm workspaces, there is no other configuration required to make this work. In my example I run `nx generate @typed/nx-plugin:package package-name-here` to generate a new 
package using my this template.
