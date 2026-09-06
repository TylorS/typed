---
id: subject
term: "Subject"
definition: "A push-capable input that can receive values."
aliases: []
related: [refsubject, fx, effect]
links: []
---

A Subject is a push-capable input boundary. Refresh commands are events: a new subscriber does not
necessarily need to repeat an earlier command. Selected-account state has a different need: a new
subscriber usually needs its current value.

Subject constructors offer different replay policies; a Subject is not automatically a global store.
A RefSubject adds current-state operations. See [event publications](/explore/subject-event-publications)
for the publication contracts and [RefSubject](#refsubject) for state.
