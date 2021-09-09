import { PluginCreator } from 'postcss'
import { resolve } from 'path'
import { writeFile } from 'fs/promises'

interface Options {
  atomicCssFile: string;
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

const creator: PluginCreator<Options> = (opts = { atomicCssFile: resolve(process.cwd(), 'dist', 'atomic.css') }) => {
  const { atomicCssFile } = opts
  const atomicMap = new Map()

  return {
    postcssPlugin: 'postcss-atomizer',

    Declaration(decl, postcss) {
      if (decl.prop === 'composes') return

      const cls = `a${hash(`${decl.prop}+${decl.value.replace(/ /g, '_')}`)}`
      const old = decl.replaceWith({ prop: 'composes', value: `${cls} from "${atomicCssFile}"` })
      if (!atomicMap.has(cls)) {
        atomicMap.set(cls, old)
      }
    },

    async OnceExit(root, { Root, result, Rule }) {
      const atomicRoot = new Root()
      const rules = [...atomicMap.entries()].map(([cls, decl]) => {
        const rule = new Rule({ selector: `.${cls}` })
        rule.append(decl)
        return rule
      })
      atomicRoot.append(...rules)
      result.messages.push({
        type: 'dependency',
        file: atomicCssFile,
      })
      console.log(atomicCssFile)
      await writeFile(atomicCssFile, atomicRoot.toString())
    },
  }
}
creator.postcss = true

export default creator
