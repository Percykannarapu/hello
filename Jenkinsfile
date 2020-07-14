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
          sh "npm ci --silent --progress=false"
        }
      }
    }
    stage('build dev apps') {
      parallel {
        stage('build impower development') {
          when { branch 'dev' }
          steps {
            withCredentials([string(credentialsId: 'ESRI_PORTAL_SERVER', variable: 'ESRI_PORTAL_SERVER'), string(credentialsId: 'ESRI_USERNAME', variable: 'ESRI_USERNAME'), string(credentialsId: 'ESRI_PASSWORD', variable: 'ESRI_PASSWORD')]) {
              wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'xterm']) {
                echo 'build for development'
                sh '''
                  node --max-old-space-size=8192  ./node_modules/.bin/ng build -c=dev-server --progress=false
                  '''
              }
            }
          }
        }
        /* Removing CPQ build from the pipeline
        stage('build cpq-maps development') {
          when { branch 'dev' }
          steps {
            withCredentials([string(credentialsId: 'ESRI_PORTAL_SERVER', variable: 'ESRI_PORTAL_SERVER'), string(credentialsId: 'ESRI_USERNAME', variable: 'ESRI_USERNAME'), string(credentialsId: 'ESRI_PASSWORD', variable: 'ESRI_PASSWORD')]) {
              wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'xterm']) {
                echo 'build for development'
                sh '''
                  node --max-old-space-size=8192  ./node_modules/.bin/ng build cpq-maps --progress=false
                  '''
              }
            } 
          }
        }*/
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
        /* Removing CPQ build from the pipeline
        stage('Deploy CPQ Maps dev') {
          when { branch 'dev' }
          steps {
            withCredentials([usernamePassword(credentialsId: 'sfdc-deploy-creds', usernameVariable: 'SFDC_USER', passwordVariable: 'SFDC_PASSWORD')]) {
              sh '''
                /data/ant/bin/ant -DUSER=$SFDC_USER -DPASS=$SFDC_PASSWORD -DSERVER_URL=https://valassis--dev.cs15.my.salesforce.com deploy
              '''
            }
          }
        }*/
      }
    }
    /*
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
             node --max-old-space-size=8192  ./node_modules/.bin/ng build -c=production --progress=false
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
      }
    }
    */
    /*stage('Static analysis') {
      parallel {
        stage('Scan imPower with Sonarqube') {
          when { branch 'dev' }
          steps {
            echo 'Run Sonarqube'
            sh '''
              /data/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=impower-angular -Dsonar.sources=applications/impower/app -Dsonar.host.url=http://valjenkins.valassis.com:9000 -Dsonar.login=f4d79d0a078650f55c4e70d8932c76e17fb478c5 -Dsonar.working.directory=.sonar-impower
              '''
            echo 'Run Checkmarx'
          }
        }
        stage('Scan cpq-maps with Sonarqube') {
          when { branch 'dev' }
          steps {
            echo 'Run Sonarqube'
            sh '''
              /data/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=cpq-maps-angular -Dsonar.sources=applications/cpq-maps/src -Dsonar.host.url=http://valjenkins.valassis.com:9000 -Dsonar.login=d9215b9638829d52e61057f089badcbe482c34a9 -Dsonar.working.directory=.sonar-cpq-maps
              '''
          }
        }
      }
    }*/
    /*
    stage('Run Tests') {
      when {
        expression {
          // Disable the jobs untill geos are fixed
          return env.BRANCH_NAME == 'dev-disabled' || env.BRANCH_NAME == 'qa'
        }
      }
      steps {
        script {
          def slackColor
          try {
            echo 'run unit tests'
            if (env.BRANCH_NAME == 'qa-disabled'){
                  echo 'Automation test cases for QA'
                  sh '''
                    rm -rf /var/lib/jenkins/Downloads/*
                    xvfb-run robot --log /robotTestcases/jenkins/reportLogs/log.html --report /robotTestcases/jenkins/reportLogs/report.html --output /robotTestcases/jenkins/reportLogs/output.xml /robotTestcases/jenkins/qa/impower_robot_regressionTestSuite/impProject.robot
                  '''
            }
            else if (env.BRANCH_NAME == 'dev-disabled'){
                  echo 'Automation test cases for Dev'
                  sh '''
                    rm -rf /var/lib/jenkins/Downloads/*
                    rm -rf /robotTestcases/jenkins/reportLogs/*
                    xvfb-run robot --log /robotTestcases/jenkins/reportLogs/log.html --report /robotTestcases/jenkins/reportLogs/report.html --output /robotTestcases/jenkins/reportLogs/output.xml /robotTestcases/jenkins/impower_robot_regressionTestSuite/impProject.robot
                  '''
            }
            slackColor = '#BDFFC3'
          }
          catch (Exception ex){
            echo 'exception in test cases'
            echo "current build number: ${currentBuild.number} ${env.JOB_NAME}"
            sh '''
              cd /robotTestcases/jenkins/reportLogs
            '''
            slackColor = '#FFFE89'
            emailext attachmentsPattern: 'log.html',
                     body: "Failed: Job ${env.JOB_NAME} build ${env.BUILD_NUMBER}\n More info at: ${env.BUILD_URL}",
                     mimeType: 'text/html', attachLog: true,
                     subject:  "Build Number - ${currentBuild.number}-${env.JOB_NAME} - Test conditions failed",
                     to: 'reddyn@valassis.com KannarapuP@valassis.com'
            echo 'Test completed'
          }
          finally{
            echo 'finally publish reports'

            step(
              [
                $class : 'RobotPublisher',
                outputPath : '/robotTestcases/jenkins/reportLogs',
                outputFileName : "output.xml",
                disableArchiveOutput : false,
                passThreshold : 100,
                unstableThreshold: 95.0,
                otherFiles : "*.png",
              ]
            )
            echo 'send slack notifications'
            slackSend channel: '#impower_test_results',
                      color: slackColor,
                      message: "Job: ${env.JOB_NAME} build: ${env.BUILD_NUMBER} Result: ${currentBuild.currentResult}\nMore info at: ${env.BUILD_URL}"
          }
        }
      }
    }
    */
  }
    /*
  post {
    always {
      // publish html
      publishHTML target: [
          allowMissing: false,
          alwaysLinkToLastBuild: false,
          keepAll: true,
          reportDir: 'Checkmarx/Reports/',
          reportFiles: 'Report_CxSAST.html',
          reportName: 'Checkmarx Static Analysis Report'
        ]
    }
  }
    */
}
