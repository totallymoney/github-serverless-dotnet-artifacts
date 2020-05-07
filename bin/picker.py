from signal import signal, SIGINT
import sys
import subprocess
import pick


max_versions = 7
env_options = ['prod', 'stage']


def handler(signal_received, frame):
    print('SIGINT or CTRL-C detected. Exiting gracefully')
    sys.exit(0)


def format_tag_option(prod_version, tag):
    prod_marker = '*prod*'
    parts = tag.split()
    if parts[0] == prod_version:
        parts.insert(1, prod_marker)
    else:
        parts.insert(1, ' ' * len(prod_marker))
    return ' '.join(parts)


def get_version_options(prod_version):
    cmd = 'git tag -l -n --sort=-v:refname "*.*" | head -{}'.format(
        max_versions)
    tags = subprocess.check_output(cmd, shell=True).splitlines()
    return map(lambda tag: format_tag_option(prod_version, tag), tags)


if __name__ == '__main__':
    signal(SIGINT, handler)
    prod_version = sys.argv[1]
    version_options = get_version_options(prod_version)
    version_msg, _ = pick.pick(version_options, 'choose version')
    env, _ = pick.pick(env_options, 'choose environment')
    version = version_msg.split()[0]
    confirm_msg = 'deploy {} to {}'.format(version, env)
    _, confirm_res = pick.pick(['cancel', confirm_msg], 'confirm')
    if confirm_res > 0:
        print(confirm_msg)
        subprocess.call(["yarn", "deploy", version, env])
    else:
        print('cancelled!')
