#!/bin/bash

# Help menu
print_help() {
	cat <<-HELP
	
	HELP
	exit 0
}
repository_dir="."
start="HEAD"
end=""
# Parse Command Line Arguments
while [ "$#" -gt 0 ]; do
  case "$1" in
    --repository_dir=|-D=*)
        repository_dir="${1#*=}"
        ;;
    --start=|-S=*)
        start="${1#*=}"
        ;;
    --end=|-E=*)
        end="${1#*=}"
        ;;
    --help) print_help;;
    *)
      printf "***********************************************************\n"
      printf "* Error: Invalid argument, run --help for valid arguments. *\n"
      printf "***********************************************************\n"
      exit 1
  esac
  shift
done


if git --git-dir="${repository_dir}/.git" diff --quiet
then
    printf "No changes detected"
    exit 1
fi

rm -r ./out
mkdir ./out
mkdir ./tmp


git --git-dir="${repository_dir}/.git" diff-tree -r --no-renames "${start}".."${end}" | \
    while read srcmode dstmode srcsha dstsha status srcfile dstfile
    do
        # do something with $srcfile and $dstfile
        git --git-dir="${repository_dir}/.git" show "$srcsha" > "./tmp/${srcsha}"
        git --git-dir="${repository_dir}/.git" show "$dstsha" > "./tmp/${dstsha}"

        node -r esm diff.js run -f="./tmp/${srcsha}" -m="./tmp/${dstsha}" -o="./out/${dstsha}.html"
    done

rm -r ./tmp