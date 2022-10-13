# Promex

> Prometheus client initialization package for nodejs

## Usage

Promex is a utility to initialize the Promster library. Install the package and use it like this:

```ts
import { init } from '@bpinternal/promex';
import express from 'express';

const app = express();

[...]

init([app]);

```

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install this package feel absolutly free to do it. We strongly recomand that you tag your versions properly.

The Botpress Engineering team.

## Licensing

This software is protected by the same license as the [main Botpress repository](https://github.com/botpress/botpress). You can find the license file [here](https://github.com/botpress/botpress/blob/master/LICENSE).