// Jenkins Pipeline for e2ee-real-time-chat-app
//
// Requirements:
// - Jenkins with Docker support enabled
// - Docker Compose
// - Tools: JDK 17, Node.js 20, Python 3.x, CycloneDX plugin, OWASP Dependency-Check, Trivy, SonarQube Scanner, OWASP ZAP
// - Credentials: NVD_API_KEY (for Dependency-Check)
//
// Pipeline Steps:
// 1. Checkout code from GitHub.
// 2. Install dependencies & generate SBOMs.
// 3. Run SAST (Semgrep) and SCA (Dependency-Check).
// 4. Run Trivy filesystem and container image scan.
// 5. Run OWASP ZAP for DAST.
// 6. Archive security reports.
//
// Change the DAST_URL variable in the environment section based on your setup
//

pipeline {
    agent any
    tools {
        jdk 'jdk17'
        nodejs 'node20'
    }
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        SHELL = '/bin/bash'
          // Define URL for DAST based on your setup
        DAST_URL = 'http://192.168.0.121:5173'
    }
    stages {
        // Clean workspace to ensure a fresh start
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        // Checkout application code from GitHub
        stage('Checkout from Git') {
            steps {
                git branch: 'main', url: 'https://github.com/SalonenTeemu/e2ee-real-time-chat-app.git'
            }
        }

        // Run Semgrep for static analysis and generate a report in JSON format
        stage('Install and Run Semgrep') {
            steps {
                // Install Semgrep and create a virtual environment and run Semgrep using the virtual environment
                sh '''
                    python3 -m venv semgrep-env
                    . semgrep-env/bin/activate
                    pip install semgrep
                    . semgrep-env/bin/activate
                    semgrep --config=auto --json > semgrep-output.json
                '''
            }
        }
        
        // Install Dependencies + Generate SBOMs for backend and frontend
        stage('Install Dependencies + SBOM') {
            steps {
                sh 'npm i'

                dir('backend') {
                    sh 'npm i'
                    sh 'cyclonedx-npm --output-file sbom-backend.json --output-format json'
                }
                dir('frontend') {
                    sh 'npm i'
                    sh 'cyclonedx-npm --output-file sbom-frontend.json --output-format json'
                }
            }
        }

        // Run Dependency Check (SCA) for backend and generate a report in XML format
         stage('Run Dependency Check (SCA) - Backend') {
            steps {
                withCredentials([string(credentialsId: 'NVD_API_KEY', variable: 'NVD_API_KEY')]) {
                    dependencyCheck additionalArguments: '--scan ./backend --exclude "**/node_modules/**" --format XML --project e2ee-backend --nvdApiKey=${NVD_API_KEY} --disableYarnAudit --disableNodeAudit --disableRetireJS', odcInstallation: 'DP-Check'
                }
            }
        }

        // Run dependency-check for SCA for frontend and generate a report in XML format
        stage('Dependency Check - Frontend') {
            steps {
                withCredentials([string(credentialsId: 'NVD_API_KEY', variable: 'NVD_API_KEY')]) {
                    dependencyCheck additionalArguments: '--scan ./frontend --exclude "**/node_modules/**" --format XML --project e2ee-frontend --nvdApiKey=${NVD_API_KEY} --disableYarnAudit --disableNodeAudit --disableRetireJS', odcInstallation: 'DP-Check'
                }
            }
        }

        // Run a file system scan with Trivy and generate a report in HTML format
        stage('Trivy File System Scan') {
            steps {
                sh 'trivy fs . --format template --template @/usr/share/trivy/contrib/html.tpl > trivy-fs-report.html'
            }
        }

        // Build Docker images using Docker Compose
        stage('Docker Compose Build') {
            steps {
                sh 'docker-compose down -v'
                sh 'docker-compose build'
                sh 'docker images'
            }
        }

        // Run Trivy container image scan for the used images and generate reports in HTML format
        stage('Trivy Image Scan') {
            steps {
                sh 'trivy image e2ee-real-time-chat-app-backend:latest --format template --template @/usr/share/trivy/contrib/html.tpl > trivy-backend-report.html'
                sh 'trivy image e2ee-real-time-chat-app-frontend:latest --format template --template @/usr/share/trivy/contrib/html.tpl > trivy-frontend-report.html'
                sh 'trivy image postgres:17-alpine --format template --template @/usr/share/trivy/contrib/html.tpl > trivy-postgres-report.html'
            }
        }

        // Run OWASP ZAP for DAST and generate a report in HTML format
        stage('OWASP ZAP (DAST)') {
            steps {
                // Run the application using Docker Compose for OWASP ZAP
                sh 'docker-compose up -d'
                sh """
                    docker run --rm -v \$(pwd):/zap/wrk/:rw \
                      --name zap \
                      -t zaproxy/zap-stable zap-baseline.py \
                      -t \$DAST_URL -I -j -r DAST_Report.html
                """
            }
        }

        // Archive the generated reports
        stage('Archive Reports') {
            steps {
                archiveArtifacts artifacts: 'backend/dependency-check-report.xml, frontend/dependency-check-report.xml, semgrep-output.json, sbom-root.json, sbom-backend.json, sbom-frontend.json, trivy-fs-report.html, trivy-backend-report.html, trivy-frontend-report.html, trivy-postgres-report.html, DAST_Report.html', onlyIfSuccessful: true
            }
        }
    }
    
    // Run cleanup tasks to remove containers, images, volumes, and networks
    post {
        always {
            script {
                sh 'docker container prune -f'
                sh 'docker image prune -f'
                sh 'docker volume prune -f'
                sh 'docker network prune -f'
                sh 'docker system prune -af'
                sh 'rm -rf ~/.m2/repository/org/owasp/dependency-check-data'
                cleanWs()
            }
        }
    }
}
