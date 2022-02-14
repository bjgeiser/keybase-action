const os = require("os");
const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

// Constant strings
const docker_image = "bjgeiser/keybase-cli";

function build_docker_command(_args)
{
    user = os.userInfo();
    const secrets_working_dir = process.cwd()

    const args = [
        'run', '--rm', '-v', secrets_working_dir +':' + secrets_working_dir, '-w', secrets_working_dir,
        "-e", "KEYBASE_UID=" + user.uid, "-e", "KEYBASE_GID=" + user.gid,
        '-e', 'KEYBASE_USERNAME=' + core.getInput("keybase_user", { required: true }) ,
        '-e', "KEYBASE_PAPERKEY=" + core.getInput("keybase_paperkey", { required: true }),
        docker_image]
    return args.concat(_args);
}

async function get_secrets_file()
{
    const args = ["github-action-secrets", core.getInput("action_command", { required: true })];
    const docker_args = build_docker_command(args);
    await exec.exec('docker', docker_args);
}

async function batch_command()
{
    const batchStr = core.getInput("action_command", {required: true});
    const command_args = ["batch", "\"" + batchStr + "\""]
    const docker_args = build_docker_command(command_args);
    await exec.exec('docker', docker_args);
}

async function file_command()
{
    const fileStr = core.getInput("action_command", {required: true});
    const command_args = ["file", fileStr]
    const docker_args = build_docker_command(command_args);
    await exec.exec('docker', docker_args);
}

async function get_file()
{
    const path = core.getInput("action_command", {required: true}).split(" ");
    const command_args = ["get"].concat(path)
    const docker_args = build_docker_command(command_args);
    await exec.exec('docker', docker_args);
}

async function clone_command()
{
    const path = core.getInput("action_command", {required: true}).split(" ");
    const command_args = ["git", "clone"].concat(path)
    const docker_args = build_docker_command(command_args);
    await exec.exec('docker', docker_args);
}

async function keybase_command()
{
    const _args = core.getInput("action_command", {required: true}).split(" ");
    var command_args = ["keybase"].concat(_args);
    if(_args[0] == "keybase") {
        command_args = _args;
    }
    const docker_args = build_docker_command(command_args);
    await exec.exec('docker', docker_args);
}

async function raw_command()
{
    const args = core.getInput("action_command", {required: true}).split(" ");
    const docker_args = build_docker_command(args);
    await exec.exec('docker', docker_args);
}


try {
    keybase_user=core.getInput("keybase_user", {required: true});
    keybase_paperkey=core.getInput("keybase_paperkey", {required: true});
    core.setSecret(keybase_user);
    core.setSecret(keybase_paperkey);

    actionType = core.getInput("action_type", {required: true});
    switch (actionType) {
        case "secrets":
            get_secrets_file();
            break;
        case "clone":
            clone_command();
            break;
        case "get":
            get_file();
            break;
        case "keybase":
            keybase_command();
            break;
        case "file":
            file_command();
            break;
        case "batch":
            batch_command();
            break;
        case "raw":
            raw_command();
            break;
        default:
            error_str = "Unsupported action_type: " + actionType
            core.error(error_str);
            throw error_str
            break;
    }
} catch (error) {
    core.error(error.message);
    core.setFailed(error.message);
}



