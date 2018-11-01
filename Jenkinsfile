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
        sh '''
            node --max-old-space-size=8192  ./node_modules/.bin/ng build -c=dev-server
           '''
      }
    }
    stage('Deliver for development') {
            when {
                branch 'dev'
            }
            steps {
                echo 'deploy dev'
            }
        }
        stage('Deploy for production') {
            when {
                branch 'master'
            }
            steps {
              echo 'deploy productoin'
            }
        }
  }
}
