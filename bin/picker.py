from sys import exit
from signal import signal, SIGINT
import subprocess
import pick


def handler(signal_received, frame):
    print('SIGINT or CTRL-C detected. Exiting gracefully')
    exit(0)


if __name__ == '__main__':
    # Tell Python to run the handler() function when SIGINT is recieved
    signal(SIGINT, handler)
    subprocess.call(['git', 'fetch', 'origin'])
    tags_cmd = 'git tag -l -n --sort=-v:refname "*.*" | head -5'
    tags_str = subprocess.check_output(tags_cmd, shell=True)
    tag_msg, _ = pick.pick(tags_str.splitlines(), 'choose version')
    env, _ = pick.pick(['stage', 'prod'], 'choose environment')
    version = tag_msg.split()[0]
    confirm_msg = 'deploy {} to {}'.format(version, env)
    _, confirm_res = pick.pick([confirm_msg, 'cancel'], 'confirm')
    if confirm_res == 0:
        print(confirm_msg)
        subprocess.call(["yarn", "deploy", version, env])
    else:
        print('cancelled')
