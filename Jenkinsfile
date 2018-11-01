pipeline{
  agent  any
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
    stage ('build') {
      steps{
        sh '$(npm bin)/ng build -c=dev-server --build-optimizer'
        sh '''
            node --max-old-space-size=8192  ./node_modules/.bin/ng build -c=dev-server --progress=false
           '''
      }
    }
  }
}
