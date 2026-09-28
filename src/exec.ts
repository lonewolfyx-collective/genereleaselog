import { x } from 'tinyexec'

export async function execCommand(cmd: string, args: string[], cwd: string): Promise<string> {
  return (await x(cmd, args, {
    nodeOptions: {
      cwd,
      shell: true,
    },
  })).stdout.trim()
}
