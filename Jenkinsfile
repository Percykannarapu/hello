pipeline{
  agent { label 'nodejs8' }
  stages{
    stage ('install modules'){
      steps{
        sh '''
            if [ ! -d "node_modules" ]; then
              npm install
            fi
        '''
      }
    }
    stage ('test'){
      steps{
        sh '''
          $(npm bin)/ng test --single-run --browsers Chrome_no_sandbox
        '''
      }
      post {
          always {
            junit "test-results.xml"
          }
      }
    }
    stage ('code quality'){
      steps{
        sh '$(npm bin)/ng lint'
      }
    }
    stage ('build') {
      steps{
        sh '$(npm bin)/ng build --prod --build-optimizer'

        sh '''
            #node --max-old-space-size=8192  ./node_modules/.bin/ng build -prod --no-progress --env=dev
            #node --max-old-space-size=8192  ./node_modules/.bin/ng build --no-progress --env=dev
            node --max-old-space-size=8192  ./node_modules/.bin/ng build -c=dev-server --progress=false
            #ssh root@vallomjbs002vm rm -rf /var/www/impower/*
            #scp -r dist/* root@vallomjbs002vm:/var/www/impower
           '''
      }
    }
  }
}
