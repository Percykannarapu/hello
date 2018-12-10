 pipeline {
  agent any
  environment {
    IMPOWER_ROOT = 'src/app'
    CPQ_MAPS_ROOT = 'applications/cpq-maps'
    QUICKMAPS_ROOT = 'applications/quickmaps'
    MODULES_ROOT = 'modules/'
    BUILD_IMPOWER = sh (
      script: "git --no-pager diff --name-only HEAD~1 HEAD | grep $IMPOWER_ROOT 1>/dev/null; if [[ $? == 0 ]]; then echo true; else echo false; fi",
      returnStdout: true
    ).trim()
    BUILD_CPQ_MAPS = sh (
      script: "git --no-pager diff --name-only HEAD~1 HEAD | grep $CPQ_MAPS_ROOT 1>/dev/null; if [[ $? == 0 ]]; then echo true; else echo false; fi",
      returnStdout: true
    ).trim()
    BUILD_QUICKMAPS = sh (
      script: "git --no-pager diff --name-only HEAD~1 HEAD | grep $QUICKMAPS_ROOT 1>/dev/null; if [[ $? == 0 ]]; then echo true; else echo false; fi",
      returnStdout: true
    ).trim()
    BUILD_ALLL = sh (
      script: "git --no-pager diff --name-only HEAD~1 HEAD | grep $MODULES_ROOT 1>/dev/null; if [[ $? == 0 ]]; then echo true; else echo false; fi",
      returnStdout: true
    ).trim()
  }
  stages {
    stage('determine build type') {
      steps {
        echo "**************************************"
        echo "***"
        echo "*** Determining Build Type"
        echo "***"
        echo "**************************************"
        echo "Environment Vars:"
        echo "IMPOWER_ROOT: ${IMPOWER_ROOT}"
        echo "CPQ_MAPS_ROOT: ${CPQ_MAPS_ROOT}"
        echo "QUICKMAPS_ROOT: ${QUICKMAPS_ROOT}"
        echo "MODULES_ROOT: ${MODULES_ROOT}"
        echo "BUILD_IMPOWER: ${BUILD_IMPOWER}"
        echo "BUILD_CPQ_MAPS: ${BUILD_CPQ_MAPS}"
        echo "BUILD_QUICKMAPS: ${BUILD_QUICKMAPS}"
        echo "BUILD_ALL: ${BUILD_ALL}"
      }
    }
    stage('install modules') {
      steps {
        wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'xterm']) {
          echo 'install all the stuff'
          sh '''
            if [ ! -d "node_modules" ]; then
              npm install
            fi
            '''
        }
      }
    }
    stage('build development') {
      when { branch 'dev' }
      steps {
        wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'xterm']) {
          echo 'build for development'
          sh '''
             node --max-old-space-size=8192  ./node_modules/.bin/ng build -c=dev-server --progress=false
             '''
        }
      }
    }
    stage('build for QA') {
      when {
        branch 'qa'
        changelog 'DEPLOY_TO: QA'
      }
      steps {
        wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'xterm']) {
          echo 'build for QA'
          sh '''
             node --max-old-space-size=8192  ./node_modules/.bin/ng build -c=qa --progress=false
            '''
        }
      }
    }
    stage('build production') {
      when { branch 'master' }
      steps {
        wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'xterm']) {
          echo 'build for production'
          sh '''
             node --max-old-space-size=8192  ./node_modules/.bin/ng build -prod --no-progress --env=dev
             '''
        }
      }
    }
    stage('Run Tests') {
      when {branch 'dev'}
      steps {
        echo 'run unit tests'
        /*
        sh '''
            node --max-old-space-size=8192  ./node_modules/.bin/ng test
            '''
        echo 'run end to end tests'
        sh '''
            node --max-old-space-size=8192  ./node_modules/.bin/ng serve
            node --max-old-space-size=8192  ./node_modules/.bin/ng e2e
            '''
         */
      }
    }
    stage('Deploy to QA') {
      when {
        branch 'qa'
        changelog 'DEPLOY_TO: QA'
      }
      steps {
        echo 'copy files to the first web server'
        /*
        sh '''
            ssh web-deployer@valwgpweb004vm rm -rf /var/www/impower/*
           '''
        sh '''
            scp -r dist/* web-deployer@valwgpweb004vm:/var/www/impower
           '''
        echo 'copy files to the second web server'
        sh '''
            ssh web-deployer@valwgpweb005vm rm -rf /var/www/impower/*
          '''
        sh '''
            scp -r dist/* web-deployer@valwgpweb005vm:/var/www/impower
           '''
          */
      }
    }
    stage('Deploy to development') {
      when { branch 'dev' }
      steps {
        echo 'deploy dev'
        sh '''
                    ssh root@vallomjbs002vm rm -rf /var/www/impower/*
                   '''
        sh '''
                    scp -r dist/* root@vallomjbs002vm:/var/www/impower
                   '''
      }
    }
    stage('SonarQube analysis') {
      when { branch 'dev' }
      steps {
        echo 'Run Sonarqube'
        sh '''
           /data/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=impower-angular -Dsonar.sources=src/app -Dsonar.host.url=http://valjenkins.valassis.com:9000 -Dsonar.login=f4d79d0a078650f55c4e70d8932c76e17fb478c5
           '''
      }
    }
  }
}

