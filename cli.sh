#!/bin/bash

# Help menu
print_help() {
	cat <<-HELP
	
	HELP
	exit 0
}
repository_dir="."
start="HEAD~1"
end="HEAD"
debug=false

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
    --debug=|-d=*)
        debug="${1#*=}"
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

if [ -d "./out" ]; then
	rm -r "./out"
fi

mkdir ./out
mkdir ./tmp

if [ "$debug" = true ] ; then
    echo "DEBUG MODE ACTIVE"
fi

git --git-dir="${repository_dir}/.git" diff-tree -r --no-renames "${start}".."${end}" | \
    while read srcmode dstmode srcsha dstsha status srcfile dstfile
    do
    	if [ -z "$dstfile"]; then
    		filename=$srcfile
    	else 
    		filename=$dstfile
    	fi

    	case "$filename" in
			*.md | *.mdx ) 
		    	echo "${dstsha} => ${filename}" >> ./out/file_list.txt
		        if [[ $srcsha =~ ^[0]+$ ]]; then
		        	#This means the file was just created...
			        git --git-dir="${repository_dir}/.git" show "$dstsha" > "./out/${dstsha}.html"
			    elif [[ $dstsha =~ ^[0]+$ ]]; then
			    	echo "File $filename has been deleted. Skipping."
		        else
		        	git --git-dir="${repository_dir}/.git" show "$srcsha" > "./tmp/${srcsha}"
			        git --git-dir="${repository_dir}/.git" show "$dstsha" > "./tmp/${dstsha}"

			        node -r esm diff.js run -f="./tmp/${srcsha}" -m="./tmp/${dstsha}" -o="./out/${dstsha}.html"
		        fi
		    ;;
		    *)
	        echo "$filename has unsupported extension"
	        ;;
		esac

    done

rm -r ./tmp