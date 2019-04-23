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
    stage('Run checkmarx') {
      steps {
        echo 'Running checkmarx stage'
        script {
          echo 'Running checkmarx scan in script block'
          step([$class: 'CxScanBuilder', comment: '', credentialsId: '', excludeFolders: '', excludeOpenSourceFolders: '', exclusionsSetting: 'global', failBuildOnNewResults: true, failBuildOnNewSeverity: 'HIGH', incremental: true, generatePdfReport: true, filterPattern: '''!**/_cvs/**/*, !**/.svn/**/*,   !**/.hg/**/*,   !**/.git/**/*,  !**/.bzr/**/*, !**/bin/**/*, !**/node_modules/**/*, !**/.sonar*/**/*, !node_modules/**/*
          !**/obj/**/*,  !**/backup/**/*, !**/.idea/**/*, !**/*.DS_Store, !**/*.ipr,     !**/*.iws,
          !**/*.bak,     !**/*.tmp,       !**/*.aac,      !**/*.aif,      !**/*.iff,     !**/*.m3u, !**/*.mid, !**/*.mp3,
          !**/*.mpa,     !**/*.ra,        !**/*.wav,      !**/*.wma,      !**/*.3g2,     !**/*.3gp, !**/*.asf, !**/*.asx,
          !**/*.avi,     !**/*.flv,       !**/*.mov,      !**/*.mp4,      !**/*.mpg,     !**/*.rm,  !**/*.swf, !**/*.vob,
          !**/*.wmv,     !**/*.bmp,       !**/*.gif,      !**/*.jpg,      !**/*.png,     !**/*.psd, !**/*.tif, !**/*.swf,
          !**/*.jar,     !**/*.zip,       !**/*.rar,      !**/*.exe,      !**/*.dll,     !**/*.pdb, !**/*.7z,  !**/*.gz,
          !**/*.tar.gz,  !**/*.tar,       !**/*.gz,       !**/*.ahtm,     !**/*.ahtml,   !**/*.fhtml, !**/*.hdm,
          !**/*.hdml,    !**/*.hsql,      !**/*.ht,       !**/*.hta,      !**/*.htc,     !**/*.htd, !**/*.war, !**/*.ear,
          !**/*.htmls,   !**/*.ihtml,     !**/*.mht,      !**/*.mhtm,     !**/*.mhtml,   !**/*.ssi, !**/*.stm,
          !**/*.stml,    !**/*.ttml,      !**/*.txn,      !**/*.xhtm,     !**/*.xhtml,   !**/*.class, !**/*.iml, !Checkmarx/Reports/*.*''', fullScanCycle: 1000, groupId: '54765168-4478-41b2-8cb3-3714a1df4b4b', includeOpenSourceFolders: '', osaArchiveIncludePatterns: '*.zip, *.war, *.ear, *.tgz', osaInstallBeforeScan: false, password: '{AQAAABAAAAAQAtw2NIROwdWnClQnFbJAhswYkn/VGVX1gw7FaOJb67E=}', preset: '36', projectName: 'test-checkmarx', sastEnabled: true, serverUrl: 'http://sa1w-cxmngr-p1', sourceEncoding: '1', username: '', vulnerabilityThresholdResult: 'FAILURE', waitForResultsEnabled: true])
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
    stage('Static analysis') {
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
    }
    stage('Run Tests') {
      when {
        expression {
          return env.BRANCH_NAME == 'dev' || env.BRANCH_NAME == 'qa'
        }
      }
      steps {
        script {
          try {
            echo 'run unit tests'
            def color
            if (env.BRANCH_NAME == 'qa'){
                  echo 'Automation test cases for QA'
                  sh '''
                    cd /robotTestcases/jenkins/qa/impower_robot_regressionTestSuite
                  '''
            }
            else if (env.BRANCH_NAME == 'dev'){
                  echo 'Automation test cases for Dev'
                  sh '''
                    cd /robotTestcases/jenkins/impower_robot_regressionTestSuite
                  '''
            }
            sh '''
              xvfb-run robot --log /robotTestcases/jenkins/reportLogs/log.html   --report  /robotTestcases/jenkins/reportLogs/report.html --output /robotTestcases/jenkins/reportLogs/output.xml impProject.robot
              '''
            color = '#BDFFC3'  
          }
          catch (Exception ex){
            echo 'exception in test cases'
            echo "current build number: ${currentBuild.number} ${env.JOB_NAME}"
            sh '''
              cd /robotTestcases/jenkins/reportLogs
            '''
            color = '#FFFE89'
            emailext attachmentsPattern: 'log.html', 
                     body: "Failed: Job ${env.JOB_NAME} build ${env.BUILD_NUMBER}\n More info at: ${env.BUILD_URL}",
                     mimeType: 'text/html', attachLog: true, 
                     subject:  "Build Number - ${currentBuild.number}-${env.JOB_NAME} - Test conditions failed", 
                     to: 'amcirillo@valassis.com GegenheiD@valassis.com ClawsonK@valassis.com reddyn@valassis.com KannarapuP@valassis.com PalathinkaraJ@valassis.com MadhukR@valassis.com CurmiN@valassis.com PeerE@valassis.com'
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
                      color: color,
                      message: "Job: ${env.JOB_NAME} build: ${env.BUILD_NUMBER} Result: ${currentBuild.currentResult}\nMore info at: ${env.BUILD_URL}"
          }
        }
      }
    }
  }
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
}
