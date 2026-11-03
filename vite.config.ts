import { simpleGit } from 'simple-git'
import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(async () => {
  const git = simpleGit();
  const shortSha = await git.revparse([ '--short', 'HEAD' ]);

  return ({
    plugins: [preact()],
    define: {
      __GIT_SHORT_HASH__: JSON.stringify(shortSha),
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'preact',
                test: /node_modules[\\/]preact/,
                priority: 20,
              }
            ]
          }
        }
      }
    },
  });
})
