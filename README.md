## About this template

This is a starter template meant to be used for small monorepo projects, although the front-end part can also serve as an independent template.

In its base, this is a Laravel project set up in an API-only variant using Laravel Breeze. The front-end portion was created using Nuxt. All non-config front-end files are located inside the web directory, making it easy to separate the front-end from the back-end. Since this is a general purpose template, server side rendering capabilities for Nuxt are turned off by default.

The project was built with [pnpm](https://pnpm.io/) as the primary package manager choice, but it can also work with other options.

The `master` branch is CSS/component-framework-agnostic. It's meant to serve as a base for other branches, but it can also be used as a standalone template.

An opinionated [Prettier](https://prettier.io/) + [ESLint](https://eslint.org/) setup is included.

Page components can be defined inside `~/web/pages` and support PascalCase naming in addition to built-in kebab-case. An empty home page was defined and can be accessed at `/` or `/home`. In addition to that, users can navigate to profile, users and password reset pages. Components relating to these pages are defined in separate directories under `~/web/components` and by default they still need to be explicitly imported. Supplementary components are located in the `~/web/components/shared` directory, and these are auto-imported by Nuxt when needed.

Two middleware functions are included: `auth` and `guest`.

An initialization plugin was created. For now, its only functionality is loading the user auth object.

Services are defined in the `~/web/services` directory. They are meant to be used for API calls and other data-related operations.

Stores are defined in the `~/web/stores` directory. They are meant to be used for storing data that needs to be shared between components. For now, two stores are included: `auth` and `loading`. The former handles all authentication processes, while the latter is used to manage loading states of components.

The project uses TypeScript by default but it's not mandatory. While it is recommended to keep config files in TypeScript, it's not necessary (or even strictly preferred) to write components in TypeScript.

To extend the styling capabilities, `sass` was added as a dependency. A `main.scss` file containing some basic global styles was created and set up.

To facilitate setups of various useful libraries, Nuxt modules were installed. The list includes: ESLint, Image, Test Utils, i18n, Pinia, VueUse, DayJS and Lodash. All lodash functions use Nuxt's auto import capabilities and can be used immediately with the `_` prefix.

A huge benefit of using Nuxt is that all of these settings can be accessed through the `nuxt.config.js` file without having to look for anything else.

## Branches

So far, the only prepared branch in addition to master is the [Vuetify](https://vuetifyjs.com) variant. It covers all the baseline functionalities present on `master` with interfaces built using ready Vuetify components. Some customization and commonly used components are included.

## Useful Links

-   **[Codeus](https://codeus.me)**

-   **[Laravel Docs](https://laravel.com/docs/11.x)**
-   **[Vue.js Docs](https://vuejs.org/guide/introduction.html)**
-   **[NuxtJS Docs](https://nuxt.com/docs/getting-started/introduction)**
-   **[Vite Docs](https://vitejs.dev/guide/)**
-   **[Pinia Docs](https://pinia.vuejs.org/introduction.html)**
-   **[Vitest Docs](https://vitest.dev/guide/)**
-   **[pnpm Docs](https://pnpm.io/motivation)**
-   **[TypeScript Docs](https://www.typescriptlang.org/docs/)**

-   **[Prettier Docs](https://prettier.io/docs/en/)**
-   **[ESLint Docs](https://eslint.org/docs/latest/)**
-   **[ESLint Vue Docs](https://eslint.vuejs.org/user-guide/)**

-   **[Vuetify Docs](https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides)**

## Contributing

Explore available branches that are dedicated to specific CSS/component frameworks or create new ones using `master` as a base. Avoid committing directly existing branches unless they're in an early phase or you are the sole contributor.

## Usage permissions

This template is meant to be used internally by employees of Codeus, clients and friends. Please don't share it outside those circles.

## Setup

### Back-end

```bash
# install dependencies
composer install

# create a copy of the .env file
cp .env.example .env

# run migrations
php artisan migrate

# generate an app key
php artisan key:generate

# start dev server on `http://localhost:8000`
php artisan serve
```

### Front-end

```bash
# install dependencies
pnpm i

# start dev server on `http://localhost:3000`
pnpm run dev

# build for production
pnpm run build

# locally preview production build
pnpm run preview
```
