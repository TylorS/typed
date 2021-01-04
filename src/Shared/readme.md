# @fp/Shared

An [Effect](../Effect/readme.md)-based implementation of managing state, and receiving lifecycle events
about those values changing over time. A great way to describe your application state without being coupled to a particular view/templating library.

`Shared` itself is an abstraction over a key-value pair with an Effect describing it's default value. 
The first time you ask for a `Shared` value it'll retrieve the default using it's provided Effect 
and save that value within a `Map` inside of the environment. The next time you request this value it will use the value stored directly in this `Map`, and you will be able to get/set/delete this value from
the `Map`. Upon deletion the next "get" will again ask for the default value and repeat.

In addition to this functionality there's a concept of having `Namespace`s that allow separating
individual maps of Shared States, useful for component-like APIs or just keeping things separated.

`Shared` is also capable of being the core abstraction to build `Effect`-based hooks and Context APIs, by default, but if not required can be dropped from the generated resource provider and provided separately. Hooks are nothing more than a key-value pair where the key is generated for you based on some other semantic, like order in which they are called.
