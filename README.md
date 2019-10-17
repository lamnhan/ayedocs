<section id="head" title="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY">

# @lamnhan/autodocs

**Document generator for Typescript projects.**

</section>

<section id="header">

[![License][license_badge]][license_url] [![Support me on Patreon][patreon_badge]][patreon_url] [![PayPal][paypal_donate_badge]][paypal_donate_url] [![Ask me anything][ask_me_badge]][ask_me_url]

</section>

<section id="toc" title="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY">

**Table of content**

- [Introduction](#introduction)
- [What the benefits?](#what-the-benefits)
- [The workflow](#the-workflow)
- [Getting started](#getting-started)
  - [The CLI](#the-cli)
    - [Install globally](#install-globally)
    - [Install locally](#install-locally)
    - [Understand the source code](#understand-the-source-code)
    - [Configuration](#configuration)
    - [Rendering input](#rendering-input)
    - [Using templates](#using-templates)
    - [Custom sections](#custom-sections)
  - [The library](#the-library)
- [Options](#options)
- [Main service](#main)
  - [`convert(declaration, output, options?)`](#main-convert-0)
  - [`generateDocs()`](#main-generatedocs-0)
  - [`output(path, rendering)`](#main-output-0)
  - [`outputLocal()`](#main-outputlocal-0)
  - [`parse(what?, child?)`](#main-parse-0)
  - [`render(rendering, currentContent?)`](#main-render-0)
  - [`renderLocal()`](#main-renderlocal-0)
- [Declaration](#declaration)
  - [`getChild(name)`](#declaration-getchild-0)
  - [`getChildId(childName)`](#declaration-getchildid-0)
  - [`getClasses()`](#declaration-getclasses-0)
  - [`getFunctionsOrMethods()`](#declaration-getfunctionsormethods-0)
  - [`getInterfaces()`](#declaration-getinterfaces-0)
  - [`getVariablesOrProperties()`](#declaration-getvariablesorproperties-0)
  - [`hasClasses()`](#declaration-hasclasses-0)
  - [`hasFunctionsOrMethods()`](#declaration-hasfunctionsormethods-0)
  - [`hasInterfaces()`](#declaration-hasinterfaces-0)
  - [`hasVariablesOrProperties()`](#declaration-hasvariablesorproperties-0)
  - [`isKind(kindString)`](#declaration-iskind-0)
  - [`setId(id)`](#declaration-setid-0)
  - [`setLevel(level)`](#declaration-setlevel-0)
- [The `Parser`](#parser)
  - [`parse(what?, child?)`](#parser-parse-0)
- [The `Converter`](#converter)
  - [`convert(declaration, output, options?)`](#converter-convert-0)
- [The `Renderer`](#renderer)
  - [`getData(rendering)`](#renderer-getdata-0)
  - [`getDataBatch(batchRendering)`](#renderer-getdatabatch-0)
  - [`render(rendering, currentContent?)`](#renderer-render-0)
  - [`renderBatch(batchRendering, batchCurrentContent?)`](#renderer-renderbatch-0)
- [Detail API Reference](https://lamnhan.com/autodocs)


</section>

<section id="introduction">

## Introduction

Documentation is a crucial part of every great open-source projects. But making the docs is such a Pain-In-The-Brain process.

Since [Typescript](https://www.typescriptlang.org) is an self documenting language, we can leverage its power to extract the source code information. This library is based on [Typedoc](https://typedoc.org), one of the best tool for generating Typescript documentation.

**@lamnhan/autodocs** is a tool for generating source code documentation automatically. It consists of 3 main services:

- [The `Parser`](#parser): turns the source into a [Declaration](#declaration).
- [The `Converter`](#converter): converts a [Declaration](#declaration) into content data.
- [The `Renderer`](#renderer): renders the content data to the final content.

Using [the CLI](#the-cli), you can easily generate a document by providing [the configuration](#options) in `package.json` or `autodocs.json` file. An example configuration:

```json
{
  "files": {
    "README.md": {
      "head": true,
      "toc": true,
      "section1": ["Options"],
      "section2": ["Main"],
      "license": true
    }
  }
}
```

Run `autodocs generate` will output:

- The `docs/` folder: the detail document, generated by [Typedoc](https://typedoc.org).
- And every document files based on the configuration.

> NOTE: **@lamnhan/autodocs** uses [Typedoc](https://typedoc.org) to generate the detail documentation.
> [The CLI](#the-cli) is only used to generate simpler additional document files, such as `README.md`.

</section>

<section id="benefit">

## What the benefits?

- Easy to config & a single cli command (`autodocs generate`)
- Avoid reference mistakes and code duplications
- Improve source code quality with [TSdoc](https://github.com/microsoft/tsdoc)
- Save time and avoid brain damage

</section>

<section id="workflow">

## The workflow

Adding **@lamnhan/autodocs** to any project in 5 simple steps:

1. Coding as usual
2. (Optional) Documenting the source code with [TSdoc](https://github.com/microsoft/tsdoc)
3. (Optional) Putting custom sections and placeholders to files
4. Add configuration to `package.json` or `autodocs.json`
5. Run `autodocs generate` to generate content

</section>

<section id="getting-started">

## Getting started

You can use **@lamnhan/autodocs** to generate documentation from the command-line interface or manually parsing, converting or rendering content in a Node application.

### The CLI

#### Install globally

```sh
npm install -g @lamnhan/autodocs
```

From the terminal, you can now run:

```sh
autodocs generate
```

#### Install locally

If you wish to run the CLI locally, you may install with `--save-dev` flag.

```sh
npm install --save-dev @lamnhan/autodocs
```

Then put a script in the `package.json`, so you can do `npm run docs` every build:

```json
{
  "scripts": {
    "docs": "autodocs generate"
  }
}
```

#### Understand the source code

A Typescript project source code contains many elements with different kinds: `Variable/Property`, `Function/Method`, `Interface`, `Class`, ...

Imagine your source code has 3 files: `file1.ts`, `file2.ts`, `file3.ts`. Each file exports certain elements.

But you can see your whole source code as a single flattened file like this:

```ts
// ================== file1.ts ==================

/**
 * This is a Variable element named `PI`
 */
export const PI = 3.14;

// ================== file2.ts ==================

/**
 * This is a Function element named `doSomething`
 */
export function doSomething() {
  return true;
}

// ================== file3.ts ==================

/**
 * This is an Interface element named `Options`
 *
 * And this is the `Options` element detail.
 *
 * Supports Markdown content.
 */
export interface Options {
  /**
   * This is a Property element named `prop1`
   */
  prop1?: string;
  prop2?: number;
}

/**
 * This is a Class element named `Main`
 *
 * And this is the `Main` element detail.
 *
 * Supports Markdown content.
 */
export class Main {
  property = "a property";
  constructor() {}
  /**
   * This is a Method element named `method1`
   */
  method1() {
    return "a method";
  }
}
```

To get a information, we turn any element of the source code into a [Declaration](#declaration) (a source code unit). There are 2 types of [Declaration](#declaration):

- **Direct**: for top level elements, such as: `Variable`, `Function`, `Interface`, `Class` and a collection of any top level elements.
- **Indirect**: for child elements of any top level element, such as: `Property` and `Method`.

#### Configuration

The CLI load configuration from `package.json` or `autodocs.json`. See [Options](#options) section for detail.

Open `package.json` and add:

```json
{
  "name": "my-package",
  "description": "My package description.",
  "@lamnhan/autodocs": {
    "files": {
      "TEST.md": {
        "head": true,
        "s1": ["Main", "SELF"]
      }
    }
  }
}
```

With the configuration above, you tell the CLI to create a file named `TEST.md` with two sections:

- The `head` section: a built-in section that display the package name and description.
- The `s1` section: a rendering section that display the source code element title and description.

The `TEST.md` content would be:

```md
<\section id="head">

\# my-package

**My package description.**

</\section>

</\section id="s1">

\## The `Main` class

**This is a Class element named `Main`**

And this is the `Main` element detail.

Supports Markdown content.

</\section>
```

#### Rendering input

Take a look at the `s1` section configuration above. We see it holds an array of values: `["Main", "SELF"]`. This array is called **a rendering input**.

A rendering input provide instructions for [the Parser](#parser) and [the Converter](#converter), it has 3 parts:

- The **WHAT**: tells [the Parser](#parser) to parse what source code element:
  - Top level elements: provide the name of the element, example: `PI`, `Options`, ...
  - Child elements: put a `#` between the parent and the child name, example: `Options#prop1`, `Main#method1`, ...
  - Collection of elements: the list of paths, `@` for `./src/` and separated by `+`, example: `@file1.ts+@lib/filex.ts`
- The **HOW** (optional, default to `SELF`): tells [the Converter](#converter) how we want to extract the information from the parsing result.
- The **options** (optional): custom converter options, see [ConverterOptions](https://lamnhan.com/autodocs/interfaces/converteroptions.html).

See [the Parser](#parser) for parsing detail and [the Converter](#converter) for converting detail.

#### Using templates

Rendering template is a convinient way to render documents for common source code structure. To use a template, just replace rendering sections with the template name:

```json
{
  "files": {
    "TEST.md": "mini"
  }
}
```

Currently supported 2 templates:

- `mini` template, included these sections:

  - **head**: package name & description
  - **toc**: table of content
  - **options**: summary properties of `Options` interface
  - **main**: full `Main` class info
  - **license**: license informatiion

- `full` template, included these sections:
  - **head**: package name & description
  - **toc**: table of content
  - **functions**: full list of all functions
  - **interfaces**: summary list of all interfaces
  - **classes**: full list of all classes
  - **license**: license informatiion

#### Custom sections

You can add any custom sections to a document file. [The CLI](#the-cli) will replace any section exists in the configuration with generated content and keep others as is.

You must wrap content inside the HTML `section` tag with a unique section id.

```md
<\section id="xxx">

Any markdown content goes here!

</\section>
```

**IMPORTANT**: If the content has these structures, you must escape them to avoid conflicts:

- `<\section id="xxx">...</\section>` (HTML sections with an id)
- `\# A heading` (Markdown headings, but **not intended** to be headings)
- `<\h1>A heading</\h1>` (HTML headings, but **not intended** to be headings)

### The library

Install: `npm install --save-dev @lamnhan/autodocs`

Use the library:

```ts
import { autodocs } from "@lamnhan/autodocs";

// init an instance
const generator = autodocs(/* Options */);

// parsing
const parsing = generator.parse("Main");

// rendering
const rendering = generator.render({
  section1: ["Options"],
  section2: ["Main"]
});
```

See [Main](#main) for service detail and [Options](#options) for more options.

</section>

<section id="options" title="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY">

<h2><a name="options" href="https://lamnhan.com/autodocs/interfaces/options.html"><p>Options</p></a></h2>

**Custom generator options**

Options can be provided in 3 ways:

- The `autodocs.json` file
- Under the **@lamnhan/autodocs** property of `package.json` file
- By the `options` param when init new [`autodocs(options?)`](https://lamnhan.com/autodocs/global.html#autodocs) instance.

| Name                                                                  | Type      | Description                                                                                                                                                   |
| --------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [files](https://lamnhan.com/autodocs/interfaces/options.html#files)   | `object`  | <p>List of documents to be generated: <strong>key</strong> is the path to the document and <strong>value</strong> is a template name or a rendering input</p> |
| [noAttr](https://lamnhan.com/autodocs/interfaces/options.html#noattr) | `boolean` | <p>Ignore generator footer attribution</p>                                                                                                                    |
| [out](https://lamnhan.com/autodocs/interfaces/options.html#out)       | `string`  | <p>Custom Typedoc output folder, default to <code>docs/</code></p>                                                                                            |
| [readme](https://lamnhan.com/autodocs/interfaces/options.html#readme) | `string`  | <p>Custom Typedoc readme</p>                                                                                                                                  |
| [url](https://lamnhan.com/autodocs/interfaces/options.html#url)       | `string`  | <p>Custom API reference url, default to the Github Pages repo url</p>                                                                                         |

</section>

<section id="main" title="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY">

<h2><a name="main" href="https://lamnhan.com/autodocs/classes/main.html"><p>Main service</p></a></h2>

**The `Main` class.**

<u>Main properties summary</u>

| Name                                                                  | Type                                                               | Description                      |
| --------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------- |
| [Content](https://lamnhan.com/autodocs/classes/main.html#content)     | [`Content`](https://lamnhan.com/autodocs/classes/content.html)     | <p>Get the Content service</p>   |
| [Converter](https://lamnhan.com/autodocs/classes/main.html#converter) | [`Converter`](https://lamnhan.com/autodocs/classes/converter.html) | <p>Get the Converter service</p> |
| [Loader](https://lamnhan.com/autodocs/classes/main.html#loader)       | [`Loader`](https://lamnhan.com/autodocs/classes/loader.html)       | <p>Get the Loader service</p>    |
| [Parser](https://lamnhan.com/autodocs/classes/main.html#parser)       | [`Parser`](https://lamnhan.com/autodocs/classes/parser.html)       | <p>Get the Parser service</p>    |
| [Project](https://lamnhan.com/autodocs/classes/main.html#project)     | [`Project`](https://lamnhan.com/autodocs/classes/project.html)     | <p>Get the Project service</p>   |
| [Renderer](https://lamnhan.com/autodocs/classes/main.html#renderer)   | [`Renderer`](https://lamnhan.com/autodocs/classes/renderer.html)   | <p>Get the Renderer service</p>  |
| [Typedoc](https://lamnhan.com/autodocs/classes/main.html#typedoc)     | [`Typedoc`](https://lamnhan.com/autodocs/classes/typedoc.html)     | <p>Get the Typedoc service</p>   |

<u>Main methods summary</u>

| Function                                                  | Returns type                                                                          | Description                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [convert(declaration, output, options?)](#main-convert-0) | `(BlockHeader \| BlockText \| BlockList \| BlockTable)[]`                             | Convert a declaration into content blocks.                                                     |
| [generateDocs()](#main-generatedocs-0)                    | `boolean`                                                                             | Generate the API reference using Typedoc.                                                      |
| [output(path, rendering)](#main-output-0)                 | `void`                                                                                | Render and save a document                                                                     |
| [outputLocal()](#main-outputlocal-0)                      | `void`                                                                                | Render and save documents based on local configuration.                                        |
| [parse(what?, child?)](#main-parse-0)                     | [`Declaration`](https://lamnhan.com/autodocs/classes/declaration.html)                | Turn the source code into a [Declaration](https://lamnhan.github.io/classes/declaration.html). |
| [render(rendering, currentContent?)](#main-render-0)      | `string`                                                                              | Render content based on configuration.                                                         |
| [renderLocal()](#main-renderlocal-0)                      | [`BatchRenderResult`](https://lamnhan.com/autodocs/interfaces/batchrenderresult.html) | Render content based on local configuration.                                                   |

<u>Main methods detail</u>

<h3><a name="main-convert-0" href="https://lamnhan.com/autodocs/classes/main.html#convert"><p><code>convert(declaration, output, options?)</code></p></a></h3>

**Convert a declaration into content blocks.**

**Parameters**

| Param           | Type                                                                            | Description               |
| --------------- | ------------------------------------------------------------------------------- | ------------------------- |
| **declaration** | [`Declaration`](https://lamnhan.com/autodocs/classes/declaration.html)          | The declaration           |
| **output**      | `string`                                                                        | Expected output           |
| options         | [`ConvertOptions`](https://lamnhan.com/autodocs/interfaces/convertoptions.html) | Custom convertion options |

**Returns**

`(BlockHeader | BlockText | BlockList | BlockTable)[]`

---

<h3><a name="main-generatedocs-0" href="https://lamnhan.com/autodocs/classes/main.html#generatedocs"><p><code>generateDocs()</code></p></a></h3>

**Generate the API reference using Typedoc.**

The default folder is **/docs**. You can change the output folder by providing the `out` property of [Options](#options).

**Returns**

`boolean`

---

<h3><a name="main-output-0" href="https://lamnhan.com/autodocs/classes/main.html#output"><p><code>output(path, rendering)</code></p></a></h3>

**Render and save a document**

**Parameters**

| Param         | Type                                                                  | Description             |
| ------------- | --------------------------------------------------------------------- | ----------------------- |
| **path**      | `string`                                                              | Path to the document    |
| **rendering** | [`Rendering`](https://lamnhan.com/autodocs/interfaces/rendering.html) | Rendering configuration |

**Returns**

`void`

---

<h3><a name="main-outputlocal-0" href="https://lamnhan.com/autodocs/classes/main.html#outputlocal"><p><code>outputLocal()</code></p></a></h3>

**Render and save documents based on local configuration.**

**Returns**

`void`

---

<h3><a name="main-parse-0" href="https://lamnhan.com/autodocs/classes/main.html#parse"><p><code>parse(what?, child?)</code></p></a></h3>

**Turn the source code into a [Declaration](https://lamnhan.github.io/classes/declaration.html).**

**Parameters**

| Param | Type                 | Description           |
| ----- | -------------------- | --------------------- |
| what  | `string \| string[]` | Parsing input         |
| child | `string`             | Parse a certain child |

**Returns**

[`Declaration`](https://lamnhan.com/autodocs/classes/declaration.html)

---

<h3><a name="main-render-0" href="https://lamnhan.com/autodocs/classes/main.html#render"><p><code>render(rendering, currentContent?)</code></p></a></h3>

**Render content based on configuration.**

**Parameters**

| Param          | Type                                                                                  | Description                 |
| -------------- | ------------------------------------------------------------------------------------- | --------------------------- |
| **rendering**  | [`Rendering`](https://lamnhan.com/autodocs/interfaces/rendering.html)                 | Redering configuration      |
| currentContent | [`ContentBySections`](https://lamnhan.com/autodocs/interfaces/contentbysections.html) | Current content by sections |

**Returns**

`string`

---

<h3><a name="main-renderlocal-0" href="https://lamnhan.com/autodocs/classes/main.html#renderlocal"><p><code>renderLocal()</code></p></a></h3>

**Render content based on local configuration.**

**Returns**

[`BatchRenderResult`](https://lamnhan.com/autodocs/interfaces/batchrenderresult.html)

---

</section>

<section id="declaration" title="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY">

<h2><a name="declaration" href="https://lamnhan.com/autodocs/classes/declaration.html"><p>Declaration</p></a></h2>

**The `Declaration` class.**

<u>Declaration properties summary</u>

| Name                                                                                 | Type               | Description |
| ------------------------------------------------------------------------------------ | ------------------ | ----------- |
| [DEFAULT_VALUE](https://lamnhan.com/autodocs/classes/declaration.html#default_value) | `any`              |             |
| [ID](https://lamnhan.com/autodocs/classes/declaration.html#id)                       | `string`           |             |
| [IS_OPTIONAL](https://lamnhan.com/autodocs/classes/declaration.html#is_optional)     | `boolean`          |             |
| [LEVEL](https://lamnhan.com/autodocs/classes/declaration.html#level)                 | `number`           |             |
| [LINK](https://lamnhan.com/autodocs/classes/declaration.html#link)                   | `string`           |             |
| [NAME](https://lamnhan.com/autodocs/classes/declaration.html#name)                   | `string`           |             |
| [PARAMETERS](https://lamnhan.com/autodocs/classes/declaration.html#parameters)       | `ReflectionData[]` |             |
| [REFLECTION](https://lamnhan.com/autodocs/classes/declaration.html#reflection)       | `Reflection`       |             |
| [RETURNS](https://lamnhan.com/autodocs/classes/declaration.html#returns)             | `string`           |             |
| [SHORT_TEXT](https://lamnhan.com/autodocs/classes/declaration.html#short_text)       | `string`           |             |
| [TEXT](https://lamnhan.com/autodocs/classes/declaration.html#text)                   | `string`           |             |
| [TYPE](https://lamnhan.com/autodocs/classes/declaration.html#type)                   | `string`           |             |
| [TYPE_LINK](https://lamnhan.com/autodocs/classes/declaration.html#type_link)         | `string`           |             |

<u>Declaration methods summary</u>

| Function                                                              | Returns type                                                           | Description |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------- |
| [getChild(name)](#declaration-getchild-0)                             | [`Declaration`](https://lamnhan.com/autodocs/classes/declaration.html) |             |
| [getChildId(childName)](#declaration-getchildid-0)                    | `string`                                                               |             |
| [getClasses()](#declaration-getclasses-0)                             | `Declaration[]`                                                        |             |
| [getFunctionsOrMethods()](#declaration-getfunctionsormethods-0)       | `Declaration[]`                                                        |             |
| [getInterfaces()](#declaration-getinterfaces-0)                       | `Declaration[]`                                                        |             |
| [getVariablesOrProperties()](#declaration-getvariablesorproperties-0) | `Declaration[]`                                                        |             |
| [hasClasses()](#declaration-hasclasses-0)                             | `boolean`                                                              |             |
| [hasFunctionsOrMethods()](#declaration-hasfunctionsormethods-0)       | `boolean`                                                              |             |
| [hasInterfaces()](#declaration-hasinterfaces-0)                       | `boolean`                                                              |             |
| [hasVariablesOrProperties()](#declaration-hasvariablesorproperties-0) | `boolean`                                                              |             |
| [isKind(kindString)](#declaration-iskind-0)                           | `boolean`                                                              |             |
| [setId(id)](#declaration-setid-0)                                     | `this`                                                                 |             |
| [setLevel(level)](#declaration-setlevel-0)                            | `this`                                                                 |             |

<u>Declaration methods detail</u>

<h3><a name="declaration-getchild-0" href="https://lamnhan.com/autodocs/classes/declaration.html#getchild"><p><code>getChild(name)</code></p></a></h3>

**The `getChild` call signature.**

**Parameters**

| Param    | Type     | Description |
| -------- | -------- | ----------- |
| **name** | `string` |             |

**Returns**

[`Declaration`](https://lamnhan.com/autodocs/classes/declaration.html)

---

<h3><a name="declaration-getchildid-0" href="https://lamnhan.com/autodocs/classes/declaration.html#getchildid"><p><code>getChildId(childName)</code></p></a></h3>

**The `getChildId` call signature.**

**Parameters**

| Param         | Type     | Description |
| ------------- | -------- | ----------- |
| **childName** | `string` |             |

**Returns**

`string`

---

<h3><a name="declaration-getclasses-0" href="https://lamnhan.com/autodocs/classes/declaration.html#getclasses"><p><code>getClasses()</code></p></a></h3>

**The `getClasses` call signature.**

**Returns**

`Declaration[]`

---

<h3><a name="declaration-getfunctionsormethods-0" href="https://lamnhan.com/autodocs/classes/declaration.html#getfunctionsormethods"><p><code>getFunctionsOrMethods()</code></p></a></h3>

**The `getFunctionsOrMethods` call signature.**

**Returns**

`Declaration[]`

---

<h3><a name="declaration-getinterfaces-0" href="https://lamnhan.com/autodocs/classes/declaration.html#getinterfaces"><p><code>getInterfaces()</code></p></a></h3>

**The `getInterfaces` call signature.**

**Returns**

`Declaration[]`

---

<h3><a name="declaration-getvariablesorproperties-0" href="https://lamnhan.com/autodocs/classes/declaration.html#getvariablesorproperties"><p><code>getVariablesOrProperties()</code></p></a></h3>

**The `getVariablesOrProperties` call signature.**

**Returns**

`Declaration[]`

---

<h3><a name="declaration-hasclasses-0" href="https://lamnhan.com/autodocs/classes/declaration.html#hasclasses"><p><code>hasClasses()</code></p></a></h3>

**The `hasClasses` call signature.**

**Returns**

`boolean`

---

<h3><a name="declaration-hasfunctionsormethods-0" href="https://lamnhan.com/autodocs/classes/declaration.html#hasfunctionsormethods"><p><code>hasFunctionsOrMethods()</code></p></a></h3>

**The `hasFunctionsOrMethods` call signature.**

**Returns**

`boolean`

---

<h3><a name="declaration-hasinterfaces-0" href="https://lamnhan.com/autodocs/classes/declaration.html#hasinterfaces"><p><code>hasInterfaces()</code></p></a></h3>

**The `hasInterfaces` call signature.**

**Returns**

`boolean`

---

<h3><a name="declaration-hasvariablesorproperties-0" href="https://lamnhan.com/autodocs/classes/declaration.html#hasvariablesorproperties"><p><code>hasVariablesOrProperties()</code></p></a></h3>

**The `hasVariablesOrProperties` call signature.**

**Returns**

`boolean`

---

<h3><a name="declaration-iskind-0" href="https://lamnhan.com/autodocs/classes/declaration.html#iskind"><p><code>isKind(kindString)</code></p></a></h3>

**The `isKind` call signature.**

**Parameters**

| Param          | Type                   | Description |
| -------------- | ---------------------- | ----------- |
| **kindString** | `keyof ReflectionKind` |             |

**Returns**

`boolean`

---

<h3><a name="declaration-setid-0" href="https://lamnhan.com/autodocs/classes/declaration.html#setid"><p><code>setId(id)</code></p></a></h3>

**The `setId` call signature.**

**Parameters**

| Param  | Type     | Description |
| ------ | -------- | ----------- |
| **id** | `string` |             |

**Returns**

`this`

---

<h3><a name="declaration-setlevel-0" href="https://lamnhan.com/autodocs/classes/declaration.html#setlevel"><p><code>setLevel(level)</code></p></a></h3>

**The `setLevel` call signature.**

**Parameters**

| Param     | Type     | Description |
| --------- | -------- | ----------- |
| **level** | `number` |             |

**Returns**

`this`

---

</section>

<section id="parser" title="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY">

<h2><a name="parser" href="https://lamnhan.com/autodocs/classes/parser.html"><p>The <code>Parser</code></p></a></h2>

**The `Parser` turns source code into [Declaration](#declaration)**

<u>Parser methods summary</u>

| Function                                | Returns type                                                           | Description |
| --------------------------------------- | ---------------------------------------------------------------------- | ----------- |
| [parse(what?, child?)](#parser-parse-0) | [`Declaration`](https://lamnhan.com/autodocs/classes/declaration.html) |             |

<u>Parser methods detail</u>

<h3><a name="parser-parse-0" href="https://lamnhan.com/autodocs/classes/parser.html#parse"><p><code>parse(what?, child?)</code></p></a></h3>

**The `parse` call signature.**

**Parameters**

| Param | Type                 | Description |
| ----- | -------------------- | ----------- |
| what  | `string \| string[]` |             |
| child | `string`             |             |

**Returns**

[`Declaration`](https://lamnhan.com/autodocs/classes/declaration.html)

---

</section>

<section id="converter" title="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY">

<h2><a name="converter" href="https://lamnhan.com/autodocs/classes/converter.html"><p>The <code>Converter</code></p></a></h2>

**The `Converter` turns [Declaration](#declaration) into content blocks**

Any kind of [Declaration](#declaration) supports certain output:

- **FULL**: for any declaration
- **SELF**: for any declaration
- **VALUE**: for `Variable` or `Property`
- **VALUE_RAW** (object only): for `Variable` or `Property`
- **SUMMARY_VARIABLES**: for `Collection`
- **FULL_VARIABLES**: for `Collection`
- **SUMMARY_FUNCTIONS**: for `Collection`
- **DETAIL_FUNCTIONS**: for `Collection`
- **FULL_FUNCTIONS**: for `Collection`
- **SUMMARY_INTERFACES**: for `Collection`
- **DETAIL_INTERFACES**: for `Collection`
- **FULL_INTERFACES**: for `Collection`
- **SUMMARY_CLASSES**: for `Collection`
- **DETAIL_CLASSES**: for `Collection`
- **FULL_CLASSES**: for `Collection`
- **SUMMARY_PROPERTIES**: for `Interface` and `Class`
- **FULL_PROPERTIES**: for `Interface` and `Class`
- **SUMMARY_METHODS**: for `Class`
- **DETAIL_METHODS**: for `Class`
- **FULL_METHODS**: for `Class`

<u>Converter methods summary</u>

| Function                                                       | Returns type                                              | Description |
| -------------------------------------------------------------- | --------------------------------------------------------- | ----------- |
| [convert(declaration, output, options?)](#converter-convert-0) | `(BlockHeader \| BlockText \| BlockList \| BlockTable)[]` |             |

<u>Converter methods detail</u>

<h3><a name="converter-convert-0" href="https://lamnhan.com/autodocs/classes/converter.html#convert"><p><code>convert(declaration, output, options?)</code></p></a></h3>

**The `convert` call signature.**

**Parameters**

| Param           | Type                                                                            | Description |
| --------------- | ------------------------------------------------------------------------------- | ----------- |
| **declaration** | [`Declaration`](https://lamnhan.com/autodocs/classes/declaration.html)          |             |
| **output**      | `string`                                                                        |             |
| options         | [`ConvertOptions`](https://lamnhan.com/autodocs/interfaces/convertoptions.html) |             |

**Returns**

`(BlockHeader | BlockText | BlockList | BlockTable)[]`

---

</section>

<section id="renderer" title="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY">

<h2><a name="renderer" href="https://lamnhan.com/autodocs/classes/renderer.html"><p>The <code>Renderer</code></p></a></h2>

**The Renderer turns a rendering input into the final content**

Builtin sections:

- `head`: Package name & description
- `toc`: Table of content
- `license`: License information

<u>Renderer methods summary</u>

| Function                                                                     | Returns type                                                                            | Description |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------- |
| [getData(rendering)](#renderer-getdata-0)                                    | [`RenderingData`](https://lamnhan.com/autodocs/interfaces/renderingdata.html)           |             |
| [getDataBatch(batchRendering)](#renderer-getdatabatch-0)                     | [`BatchRenderingData`](https://lamnhan.com/autodocs/interfaces/batchrenderingdata.html) |             |
| [render(rendering, currentContent?)](#renderer-render-0)                     | `string`                                                                                |             |
| [renderBatch(batchRendering, batchCurrentContent?)](#renderer-renderbatch-0) | [`BatchRenderResult`](https://lamnhan.com/autodocs/interfaces/batchrenderresult.html)   |             |

<u>Renderer methods detail</u>

<h3><a name="renderer-getdata-0" href="https://lamnhan.com/autodocs/classes/renderer.html#getdata"><p><code>getData(rendering)</code></p></a></h3>

**The `getData` call signature.**

**Parameters**

| Param         | Type                                                                  | Description |
| ------------- | --------------------------------------------------------------------- | ----------- |
| **rendering** | [`Rendering`](https://lamnhan.com/autodocs/interfaces/rendering.html) |             |

**Returns**

[`RenderingData`](https://lamnhan.com/autodocs/interfaces/renderingdata.html)

---

<h3><a name="renderer-getdatabatch-0" href="https://lamnhan.com/autodocs/classes/renderer.html#getdatabatch"><p><code>getDataBatch(batchRendering)</code></p></a></h3>

**The `getDataBatch` call signature.**

**Parameters**

| Param              | Type                                                                            | Description |
| ------------------ | ------------------------------------------------------------------------------- | ----------- |
| **batchRendering** | [`BatchRendering`](https://lamnhan.com/autodocs/interfaces/batchrendering.html) |             |

**Returns**

[`BatchRenderingData`](https://lamnhan.com/autodocs/interfaces/batchrenderingdata.html)

---

<h3><a name="renderer-render-0" href="https://lamnhan.com/autodocs/classes/renderer.html#render"><p><code>render(rendering, currentContent?)</code></p></a></h3>

**The `render` call signature.**

**Parameters**

| Param          | Type                                                                                  | Description |
| -------------- | ------------------------------------------------------------------------------------- | ----------- |
| **rendering**  | [`Rendering`](https://lamnhan.com/autodocs/interfaces/rendering.html)                 |             |
| currentContent | [`ContentBySections`](https://lamnhan.com/autodocs/interfaces/contentbysections.html) |             |

**Returns**

`string`

---

<h3><a name="renderer-renderbatch-0" href="https://lamnhan.com/autodocs/classes/renderer.html#renderbatch"><p><code>renderBatch(batchRendering, batchCurrentContent?)</code></p></a></h3>

**The `renderBatch` call signature.**

**Parameters**

| Param               | Type                                                                            | Description |
| ------------------- | ------------------------------------------------------------------------------- | ----------- |
| **batchRendering**  | [`BatchRendering`](https://lamnhan.com/autodocs/interfaces/batchrendering.html) |             |
| batchCurrentContent | `object`                                                                        |             |

**Returns**

[`BatchRenderResult`](https://lamnhan.com/autodocs/interfaces/batchrenderresult.html)

---

</section>

<section id="license" title="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY">

## License

**@lamnhan/autodocs** is released under the [MIT](https://github.com/lamnhan/autodocs/blob/master/LICENSE) license.

</section>

<section id="footer">

[license_badge]: https://img.shields.io/github/license/mashape/apistatus.svg
[license_url]: https://github.com/lamnhan/autodocs/blob/master/LICENSE
[patreon_badge]: https://lamnhan.github.io/assets/images/badges/patreon.svg
[patreon_url]: https://www.patreon.com/lamnhan
[paypal_donate_badge]: https://lamnhan.github.io/assets/images/badges/paypal_donate.svg
[paypal_donate_url]: https://www.paypal.me/lamnhan
[ask_me_badge]: https://img.shields.io/badge/ask/me-anything-1abc9c.svg
[ask_me_url]: https://m.me/lamhiennhan

</section>

<section id="attr" title="AUTO-GENERATED CONTENT, DO NOT EDIT DIRECTLY">

---

⚡️ This document is generated automatically using [@lamnhan/autodocs](https://github.com/lamnhan/autodocs).

</section>
