#!/bin/bash


#---  FUNCTION  ----------------------------------------------------------------
#          NAME:  get-script-dir
#   DESCRIPTION:  Gets the current script directory
#    PARAMETERS:  
#       RETURNS:  
#-------------------------------------------------------------------------------
get-script-dir ()
{
   	source="${BASH_SOURCE[0]}"
	while [ -h "$source" ]; do # resolve $source until the file is no longer a symlink
  		dir="$( cd -P "$( dirname "$source" )" && pwd )"
  		source="$(readlink "$source")"
  		# if $source was a relative symlink, we need to resolve it relative
 		# to the path where the symlink file was located
  		[[ $source != /* ]] && source="$dir/$source"
	done
	dir="$( cd -P "$( dirname "$source" )" && pwd )"
	echo $dir
}	# ----------  end of function get-script-dir  ----------


dotfile_path=$(get-script-dir)
real_config_path=$dotfile_path
home_path=$HOME
link_path=$home_path/.atom

echo "Linking atom dofolder."
echo "Checking if previous .atom exists."

if [ -f $link_path ]; then
	echo "Previous dotfile/folder exists, backing it up with .bak suffix"
	mv $link_path $linkPath.bak
fi

if [ -L $link_path ]; then
	echo "Previous symlink exists, removing it."
	rm $link_path
fi



echo "Creating symlink for .atom"
echo "$link_path -> $real_config_path"
ln -s $real_config_path $link_path

echo

echo "Dotfile preperation complete!"
exit 0
