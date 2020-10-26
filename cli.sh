#!/bin/bash

# Help menu
print_help() {
	cat <<-HELP
Usage:
./cli.sh -D="~/repository" -S=HEAD~20 -E=HEAD~10

  -D | --repository_dir      Path of repository you want to run diff on.
  -S | --start               First commit of diff
  -E | --end                 Last commit of diff. HEAD if left empty
  -d | --debug               Prints more verbose output
  -u | --upload              Upload to google drive
  -h | --help                Prints this help
	HELP
	exit 0
}
repository_dir="."
start="HEAD~1"
end="HEAD"
verbose=false
upload=false

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
    --verbose=|-v=*)
        verbose="${1#*=}"
        ;;
    --upload|-u*)
        upload=true
        ;;
    --help|-h) print_help;;
    *)
      printf "***********************************************************\n"
      printf "* Error: Invalid argument, run --help for valid arguments. *\n"
      printf "***********************************************************\n"
      exit 1
  esac
  shift
done

start=$(git --git-dir="${repository_dir}/.git" rev-parse $start)
end=$(git --git-dir="${repository_dir}/.git" rev-parse $end)

echo "RUNNING DIFF FROM ${start} TO ${end}";

if git --git-dir="${repository_dir}/.git" diff --quiet "${start}".."${end}"
then
    printf "No changes detected"
    exit 1
fi

if [ -d "./out" ]; then
	rm -r "./out"
fi

mkdir ./out
mkdir ./tmp

if [ "$verbose" = true ] ; then
    echo "VERBOSE MODE ACTIVE"
fi

if [ "$upload" = true ] ; then
    node -r esm upload.js cleanup -c="${start}"
    node -r esm upload.js cleanup -c="${end}"
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

                    if [ "$upload" = true ] ; then
                        node -r esm diff.js compile -f="./tmp/${srcsha}" -m="./tmp/${dstsha}"

                        node -r esm upload.js upload -f="./tmp/${srcsha}.html" -n="${filename}" -c="${start}"

                        node -r esm upload.js upload -f="./tmp/${dstsha}.html" -n="${filename}" -c="${end}"
                    else
		    	        node -r esm diff.js run -f="./tmp/${srcsha}" -m="./tmp/${dstsha}" -o="./out/${dstsha}.html"
                    fi
		        fi
		    ;;
		    *)
            if [ "$verbose" = true ] ; then
	            echo "$filename has unsupported extension"
            fi
	        ;;
		esac

    done

rm -r ./tmp
