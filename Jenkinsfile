pipeline {
  agent any
  stages {
    stage('install modules') {
      steps {
        sh '''
            if [ ! -d "node_modules" ]; then
              npm install
            fi
        '''
        echo 'install all the stuff'
      }
    }
    stage('build development') {
      when {
        branch 'dev'
      }
      steps {
        echo 'build for development'
        sh '''
                node --max-old-space-size=8192  ./node_modules/.bin/ng build -c=dev-server
               '''
      }
    }
    stage('build for QA') {
      when {
        branch 'qa'
        changelog 'DEPLOY_TO: QA'
      }
      steps {
        echo 'build for QA'
        sh '''
            node --max-old-space-size=8192  ./node_modules/.bin/ng build -c=qa --progress=false
           '''
      }
    }
    stage('build production') {
      when {
        branch 'master'
      }
      steps {
        echo 'build for production'
        sh '''
                node --max-old-space-size=8192  ./node_modules/.bin/ng build -prod --no-progress --env=dev
               '''
      }
    }
    stage('Run Tests') {
      when {
        branch 'dev'
      }
      steps {
        echo 'run unit tests'
        echo 'run end to end tests'
        sh '''
            node --max-old-space-size=8192  ./node_modules/.bin/ng serve
            node --max-old-space-size=8192  ./node_modules/.bin/ng e2e
            '''
      }
    }
    stage('Deploy to QA') {
      when {
        branch 'qa'
        changelog 'DEPLOY_TO: QA'
      }
      steps {
        echo 'copy files to the first web server'
      }
    }
    stage('Deploy to development') {
      when {
        branch 'dev'
      }
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
  }
}