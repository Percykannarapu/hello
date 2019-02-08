 def BUILD_TYPE
 pipeline {
  agent any
  environment {
    BUILD_TYPE = sh (
      script: "sh /data/build-scripts/impower/build_type.sh",
      returnStdout: true
    ).trim()
  }
  stages {
    stage('determine build type') {
      steps {
        script {
          BUILD_TYPE = sh (
            script: "sh ./build_type.sh",
            returnStdout: true
          ).trim()
        }
        echo "BUILD_TYPE: ${BUILD_TYPE}"
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
    stage('build dev apps') {
      parallel {
        stage('build impower development') {
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
        stage('build cpq-maps development') {
          when { branch 'dev' }
          steps {
            wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'xterm']) {
              echo 'build for development'
              sh '''
                node --max-old-space-size=8192  ./node_modules/.bin/ng build cpq-maps --progress=false
                '''
            }
          }
        }
      }
    }
    stage('Deploy dev apps') {
      parallel {
        stage('Deploy imPower dev') {
          when { branch 'dev' }
          steps {
            echo 'deploy dev'
            sh '''
              ssh root@vallomjbs002vm rm -rf /var/www/impower/*
              '''
            sh '''
              scp -r dist/impower/* root@vallomjbs002vm:/var/www/impower
              '''
          }
        }
        stage('Deploy CPQ Maps dev') {
          when { branch 'dev' }
          steps {
            sh "/data/ant/bin/ant clean create-resources deploy"
          }
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
    stage('SonarQube analysis') {
      parallel {
        stage('scan imPower') {
          when { branch 'dev' }
          steps {
            echo 'Run Sonarqube'
            sh '''
              /data/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=impower-angular -Dsonar.sources=applications/impower/app -Dsonar.host.url=http://valjenkins.valassis.com:9000 -Dsonar.login=f4d79d0a078650f55c4e70d8932c76e17fb478c5 -Dsonar.working.directory=.sonar-impower
              '''
          }
        }
        stage('scan cpq-maps') {
          when { branch 'dev' }
          steps {
            echo 'Run Sonarqube'
            sh '''
              /data/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=cpq-maps-angular -Dsonar.sources=applications/cpq-maps/src -Dsonar.host.url=http://valjenkins.valassis.com:9000 -Dsonar.login=d9215b9638829d52e61057f089badcbe482c34a9 -Dsonar.working.directory=.sonar-cpq-maps
              '''
          }
        }
      }
    }
    stage('Run Tests') {
      when {branch 'dev'}
      steps {
        echo 'run unit tests'
        sh '''
          cd /robotTestcases/jenkins/impower_robot_regressionTestSuite
          git pull
          xvfb-run robot --log /robotTestcases/jenkins/reportLogs/log.html   --report  /robotTestcases/jenkins/reportLogs/report.html --output /robotTestcases/jenkins/reportLogs/output.xml impProject.robot
          '''
          emailext attachmentsPattern: '/robotTestcases/jenkins/reportLogs/*.*', body: 'imPowerTestResults', subject: 'imPowerTestResults', to: 'reddyn@valassis.com'
          mail to: 'reddyn@valassis.com',
               subject: 'test robot email',
               body: 'test data body'

          slackSend channel: '#general',
                    color: 'good',
                    message: "The pipeline jenkins'

        echo 'Test completed'
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
  }
}
