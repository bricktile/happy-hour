set -ue
# TODO: check must be on master branch
git add .
git checkout -b tmp_$AUTHOR
git commit -m "[$AUTHOR] daily update"
git checkout master
git pull
git checkout tmp_$AUTHOR
git rebase master
git checkout master
git merge tmp_$AUTHOR
git push origin
git branch -D tmp_$AUTHOR
