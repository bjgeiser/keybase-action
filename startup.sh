#!/bin/bash

set -euo pipefail

echo Running user UID: $UID

if [ "$EUID" -eq 0 ]; then

  echo Creating keybase user

  gids=""
  if [[ -v KEYBASE_GID ]] && [[ ! -z "$KEYBASE_GID" ]] ; then
    if ! grep -q $KEYBASE_GID /etc/group; then
      groupadd -g $KEYBASE_GID keybase >/dev/null
    fi
    gids="--gid $KEYBASE_GID"
  fi

  uids=""
   if [[ -v KEYBASE_UID ]] && [[ ! -z "$KEYBASE_UID" ]]; then
    uids="-u $KEYBASE_UID"
  fi


  adduser $uids $gids --disabled-password --gecos "" keybase >/dev/null

  export STARTUP_USER_SET=1

  # run startup as again as the keybase user
  command="-c /startup.sh ${@:1}"
  su -w HOME keybase "$command"

else
  if [[ ! -v STARTUP_USER_SET ]]; then
    echo "Error: Set UID and GID using -e KEYBASE_UID={uid} -e KEYBASE_GID={gid} instead of --user"
    exit 1
  fi

  # start keybase service in the background
  keybase -run-mode prod service &>/dev/null &

  # start kbfsfuse in the background
  kbfsfuse -log-to-file -mount-type=none &>/dev/null &

  # Wait up to 10 seconds each for both the service and KBFS to start
  keybase ctl wait --include-kbfs >/dev/null

  # If env vars are present run one shot
  if [ -v KEYBASE_USERNAME ] && [ -v KEYBASE_PAPERKEY ]; then
      keybase --no-auto-fork --no-debug oneshot >/dev/null
  else
    echo "Error: Set -e KEYBASE_USERNAME={user} -e KEYBASE_PAPERKEY={paperkey}"
    exit 1
  fi

  python3 /process_commands.py "${@:1}"
fi
