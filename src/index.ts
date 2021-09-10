import { Declaration, PluginCreator, Rule } from 'postcss'
import { resolve } from 'path'
import { writeFile } from 'fs/promises'

interface Options {
  atomicCssFile: string;
}

interface DeclCounter {
  first: Declaration;
  decl: Declaration;
  count: number;
  cls: string;
}

function hash(s: string): string {
  var hash = 0, i, chr;
  if (s.length === 0) return hash.toString();
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
};

function clsKey(decl: Declaration): string {
  return `${decl.prop}+${decl.value.replace(/ /g, '_')}`
}

function hashify(key: string): string {
  return `a${hash(key)}`
}

const creator: PluginCreator<Options> = (opts = { atomicCssFile: resolve(process.cwd(), 'dist', 'atomic.css') }) => {
  const atomicMap = new Map<string, DeclCounter>()
  const { atomicCssFile } = opts

  function countCommonDecl(decl: Declaration): DeclCounter {
    const key = clsKey(decl)
    const value = atomicMap.get(key)
    if (value === undefined) {
      const cls = hashify(key)
      const counter = { first: decl, decl: decl.clone(), count: 1, cls }
      atomicMap.set(key, counter)
      return counter
    }
    const counter = value
    counter.count += 1
    atomicMap.set(key, counter)
    return counter
  }

  return {
    postcssPlugin: 'postcss-atomizer',

    Declaration(decl, { Rule }) {
      if (decl.prop === 'composes') return
      if (decl.parent?.type === 'rule' && !(decl.parent as Rule).selector.startsWith('.')) return

      const { first, count, cls, decl: commonDecl } = countCommonDecl(decl)
      if (count > 2) {
        decl.replaceWith({ prop: 'composes', value: `${cls} from global` })
      } else if (count === 1) {
        // do nothing
      } else {
        const value = `${cls} from global`
        const root = decl.root()
        decl.replaceWith({ prop: 'composes', value })
        const old = first.replaceWith({ prop: 'composes', value })
        const rule = new Rule({ selector: `:global(.${cls})` })
        rule.append(commonDecl)
        root.append(rule)
        console.log('first>>>>', first.toString(), old.toString())
        console.log('root??????', root.toString())
      }
    },

    async OnceExit(root, { Root, result, Rule }) {
      console.log(root.toString())
      console.log([...atomicMap.entries()].filter(([, { count }]) => count > 1).map(([key]) => key))
    }
    // async OnceExit(root, { Root, result, Rule }) {
    //   const atomicRoot = new Root()
    //   const rules = [...atomicMap.entries()]
    //     .filter(([, { count }]) => count > 1)
    //     .map(([, { decl, cls }]) => {
    //       const rule = new Rule({ selector: `.${cls}` })
    //       rule.append(decl)
    //       return rule
    //     })
    //   atomicRoot.append(...rules)
    //   result.messages.push({
    //     type: 'dependency',
    //     file: atomicCssFile,
    //   })
    //   console.log('common: ', atomicRoot.toString())
    //   await writeFile(atomicCssFile, atomicRoot.toString())
    // },
  }
}
creator.postcss = true

export default creator
