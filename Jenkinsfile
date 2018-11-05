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
    stage('Deploy to testing') {
            when {branch 'dev'}
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
        stage('Deploy to production') {
            when {branch 'master'}
            steps {
              echo 'deploy production placeholder.....'
            }
        }
  }
}
