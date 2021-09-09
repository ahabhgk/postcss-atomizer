const postcss = require('postcss')

const plugin = require('./')

async function run(input, { css, messages }, opts = {}) {
  let result = await postcss([plugin(opts)]).process(input, { from: undefined })
  expect(result.css).toEqual(css)
  messages.forEach(msg => expect(result.messages).toContainEqual(msg))
  expect(result.warnings()).toHaveLength(0)
}

it('does something', async () => {
  await run(`.containerA {
  color: red;
  background-color: blue;
  display: flex;
}

.containerB {
  color: green;
  background-color: blue;
  display: flex;
}
`,
    {
      css: `.containerA {
  composes: color&red from "./atomic.css";
  composes: background-color&blue from "./atomic.css";
  composes: display&flex from "./atomic.css";
}

.containerB {
  composes: color&green from "./atomic.css";
  composes: background-color&blue from "./atomic.css";
  composes: display&flex from "./atomic.css";
}`,
      messages: [
        {
          type: 'dependency',
          file: '', // TODO
          // content: `.color$red: {
          //   color: red;
          // }
          // .color$green: {
          //   color: green;
          // }
          // .background$color {
          //   background-color: blue;
          // }
          // .display$flex: {
          //   display: flex;
          // }`
        }
      ]
    },
    {},
  )
})
