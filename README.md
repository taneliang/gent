# Gent

[![CircleCI](https://circleci.com/gh/taneliang/gent.svg?style=svg&circle-token=aaccc68a5d5c69c7e12d0aac4c4f634b3541191e)](https://circleci.com/gh/taneliang/gent)
[![codecov](https://codecov.io/gh/taneliang/gent/branch/master/graph/badge.svg?token=YujmMhCbcm)](https://codecov.io/gh/taneliang/gent)
[![Maintainability](https://api.codeclimate.com/v1/badges/de5ee9969c95be65c13b/maintainability)](https://codeclimate.com/repos/5edb9bb4ea7a936f29001012/maintainability)

Gent is a lightweight, reusable business logic layer that makes it easy to
build GraphQL servers in Node.js and TypeScript.

## Key Features

1. It uses MikroORM and Knex to work with SQL databases.
1. Some requests can be batched with Dataloader.
1. Authorization checks have first class support - write your own access
   control rules and Gent will use them when doing any CRUD operation.
1. Gent makes extensive use of human-readable code generation to keep magic
   and opaque framework code to a minimum. More on this below.

## Code Generation

We use [@elg/tscodegen](https://www.npmjs.com/package/@elg/tscodegen) to
generate models and boilerplate code based on an entity's schema.

There are many benefits to generating away your boilerplate code:

1. A lot of functionality with just one `gentgen` execution: just create a
   schema, and Gent will generate typesafe and authorized classes for the
   entity.
1. Your boilerplate code will always be kept up to date - when the schema
   changes or Gent gets an upgrade, a `gentgen` execution will be all you
   need to gain all that shiny new functionality.
1. Gent code is very easy to understand and debug, as they are meant for
   humans and are kept in your codebase.
1. tscodegen allows you to modify generated code. You can thus extend the
   generated functionality without breaking abstraction barriers or causing
   subclasses to appear throughout your codebase. Subsequent code generations
   will preserve your manually written code. Well, mostly, but Git will save
   you the rest of the time.

Having said that, we know our limits; where possible, we implement
functionality within Gent's framework code to prevent unnecessarily
duplicating code.

## Installation

```sh
# Clone this repo
git clone git@github.com:taneliang/gent.git
cd gent
yarn # Install dependencies
yarn link

# cd to your project directory
yarn link @elg/gent
```

TODO: This package isn't on NPM yet; the below commands won't work.

```sh
# npm install @elg/gent prettier # NPM
# yarn add @elg/gent prettier # Yarn
```

## Usage

TODO:

## Inspiration

Gent is heavily inspired by Facebook's open source [Ent](https://entgo.io/),
as well as the below descriptions of Facebook's Ent framework:

- [Evolution of Code Design at Facebook - Nick Schrock (2011)](https://www.infoq.com/presentations/Evolution-of-Code-Design-at-Facebook/)
- [DataLoader v2.0 - Lee Byron](https://medium.com/@leeb/dataloader-v2-0-925b4dccf8d6)
- [Fast and maintainable patterns for fetching from a database - Sophie Alpert](https://sophiebits.com/2020/01/01/fast-maintainable-db-patterns.html)
