#!/bin/bash

######################################################
### This is a build helper script which will
### attempt to detect the application or module
### that has changed in this source tree and
### let the Jenkins build system know what to build
######################################################

GIT=$(which git)
GREP=$(which grep)

IMPOWER_ROOT='applications/impower'
CPQ_MAPS_ROOT='applications/cpq-maps'
QUICKMAPS_ROOT='applications/quickmaps'
MODULES_ROOT='modules/'
BUILD_TYPE=''

$GIT --no-pager diff --name-only HEAD~1 HEAD | $GREP $IMPOWER_ROOT 1>/dev/null; if [[ $? == 0 ]]; then BUILD_TYPE='BUILD_IMPOWER'; fi
$GIT --no-pager diff --name-only HEAD~1 HEAD | $GREP $CPQ_MAPS_ROOT 1>/dev/null; if [[ $? == 0 ]]; then BUILD_TYPE='BUILD_CPQ_MAPS'; fi
$GIT --no-pager diff --name-only HEAD~1 HEAD | $GREP $QUICKMAPS_ROOT 1>/dev/null; if [[ $? == 0 ]]; then BUILD_TYPE='BUILD_QUICKMAPS'; fi
$GIT --no-pager diff --name-only HEAD~1 HEAD | $GREP $MODULES_ROOT | $GREP -v val-modules 1>/dev/null; if [[ $? == 0 ]]; then BUILD_TYPE='BUILD_ALL'; fi

if [ -z "$BUILD_TYPE" ]
then
    #default to BUILD_ALL if we didn't get a value
    BUILD_TYPE='BUILD_ALL'
fi

echo $BUILD_TYPE
