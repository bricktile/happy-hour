set -xue
DATE=`date "+%Y%m%d"`
BASE_FILE=${TARGET}/${TITLE}

if [[ -f "${BASE_FILE}.md" ]]; then
    echo "${BASE_FILE}.md exists try create a new file with a sequence number"
else
    cat tmpl.md | sed -E "s/\{DATE\}/$DATE/g" | sed -E "s/\{AUTHOR\}/$AUTHOR/g" > ${BASE_FILE}.md
    exit
fi

FILE_COUNTER_EXT=1
while true; do
    if [[ -f "${BASE_FILE}-${FILE_COUNTER_EXT}.md" ]]; then
        let "FILE_COUNTER_EXT += 1"
    else
        break
    fi
done

cat tmpl.md | sed -E "s/\{DATE\}/$DATE/g" | sed -E "s/\{AUTHOR\}/$AUTHOR/g" > ${BASE_FILE}-${FILE_COUNTER_EXT}.md
