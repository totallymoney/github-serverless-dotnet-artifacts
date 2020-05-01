from sys import exit
from signal import signal, SIGINT
import subprocess
import pick

max_versions = 5
env_options = ['stage', 'prod']


def handler(signal_received, frame):
    print('SIGINT or CTRL-C detected. Exiting gracefully')
    exit(0)


if __name__ == '__main__':
    signal(SIGINT, handler)
    subprocess.call(['git', 'fetch', 'origin'])
    tags_cmd = 'git tag -l -n --sort=-v:refname "*.*" | head -{}'.format(
        max_versions)
    tags_str = subprocess.check_output(tags_cmd, shell=True)
    tag_msg, _ = pick.pick(tags_str.splitlines(), 'choose version')
    env, _ = pick.pick(env_options, 'choose environment')
    version = tag_msg.split()[0]
    confirm_msg = 'deploy {} to {}'.format(version, env)
    _, confirm_res = pick.pick([confirm_msg, 'cancel'], 'confirm')
    if confirm_res == 0:
        print(confirm_msg)
        subprocess.call(["yarn", "deploy", version, env])
    else:
        print('cancelled!')
