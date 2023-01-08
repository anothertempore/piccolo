# Piccolo

A minimal, type-safe Electron data store library. Support main process and preload script. Inspired by [electron-nano-store](https://github.com/cawa-93/electron-nano-store)

## Usage

In preload script:

```js
import { createStore } from "piccolo"

const store = createStore('storeName');

store.set('abc', 'def');
store.get('abc') // def
```

In main process:

```js
import { createStore } from "piccolo"
import { app } from 'electron'

const store = createStore('storeName', app.getPath('userData'));

store.set('abc', 'def');
store.get('abc') // def
```
