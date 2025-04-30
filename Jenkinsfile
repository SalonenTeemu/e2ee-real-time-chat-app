// Jenkins Pipeline for e2ee-real-time-chat-app

// Focus: This Jenkins pipeline is used to run the security testing of the e2ee-real-time-chat-app project. 
// It performs Static Application Security Testing (SAST) using Semgrep, Software Composition Analysis (SCA) using OWASP Dependency-Check, 
// filesystem and container image scanning using Trivy, and Dynamic Application Security Testing (DAST) using OWASP ZAP. 
// The pipeline generates various security reports and archives them for review.

// Requirements:
// - Jenkins with Docker support enabled
// - Docker Compose
// - Tools: Git, JDK 17, Node.js 20, Python 3.x, Semgrep, CycloneDX plugin, OWASP Dependency-Check, Trivy, OWASP ZAP
// - Credentials: NVD_API_KEY (for Dependency-Check). Can be requested from: https://nvd.nist.gov/developers/request-an-api-key

// Pipeline Steps:
// 1. Clean workspace to ensure a fresh start.
// 2. Checkout code from GitHub.
// 3. Install Semgrep and run SAST scan, generating a report in JSON format.
// 4. Install dependencies & generate SBOMs for root, backend, and frontend using CycloneDX.
// 5. Run OWASP Dependency-Check for SCA on backend and frontend, generating reports in XML format.
// 6. Run Trivy filesystem scan and generate a report in HTML format.
// 7. Build Docker images using Docker Compose.
// 8. Run Trivy container image scan for the used images and generate reports in HTML format.
// 9. Run OWASP ZAP for DAST and generate a report in HTML format.
// 10. Archive all generated security reports.
// 11. Cleanup: remove Docker artifacts and reset workspace to free up space.

// Note: Change the DAST_URL variable in the environment section of the pipeline based on your setup.

pipeline {
    agent any
    tools {
        jdk 'jdk17'
        nodejs 'node20'
    }
    environment {
        // Define frontend base URL for OWASP ZAP DAST testing (adjust based on environment)
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

        // Run Semgrep for Static Application Security Testing (SAST) and generate a report in JSON format
        stage('Install and Run Semgrep (SAST)') {
            steps {
                // Create a virtual environment, install Semgrep and run Semgrep using the virtual environment
                sh '''
                    python3 -m venv semgrep-env
                    . semgrep-env/bin/activate
                    pip install semgrep
                    semgrep --config=auto --json --exclude semgrep-env/ --exclude docs/ > semgrep-output.json
                '''
            }
        }
        
        // Install Dependencies + Generate SBOMs for root, backend and frontend
        stage('Install Dependencies and generate SBOMs') {
            steps {
                sh 'npm install'
                sh 'cyclonedx-npm --output-file sbom-root.json --output-format json'

                dir('backend') {
                    sh 'npm install'
                    sh 'cyclonedx-npm --output-file sbom-backend.json --output-format json'
                }
                dir('frontend') {
                    sh 'npm install'
                    sh 'cyclonedx-npm --output-file sbom-frontend.json --output-format json'
                }
            }
        }

        // Run Dependency Check (SCA) for backend and generate a report in XML format
        stage('Run Dependency Check (SCA) - Backend') {
            steps {
                withCredentials([string(credentialsId: 'NVD_API_KEY', variable: 'NVD_API_KEY')]) {
                    dependencyCheck additionalArguments: '--scan ./backend --out ./backend --format XML --project e2ee-backend --nvdApiKey=${NVD_API_KEY} --disableYarnAudit --disableNodeAudit', odcInstallation: 'DP-Check'
                }
                // Move and rename the generated report for easier access
                sh 'mv ./backend/dependency-check-report.xml ./dependency-check-report-backend.xml'
            }
        }

        // Run Dependency Check (SCA) for frontend and generate a report in XML format
        stage('Run Dependency Check (SCA) - Frontend') {
            steps {
                withCredentials([string(credentialsId: 'NVD_API_KEY', variable: 'NVD_API_KEY')]) {
                    dependencyCheck additionalArguments: '--scan ./frontend --out ./frontend --format XML --project e2ee-frontend --nvdApiKey=${NVD_API_KEY} --disableYarnAudit --disableNodeAudit', odcInstallation: 'DP-Check'
                }
                // Move and rename the generated report for easier access
                sh 'mv ./frontend/dependency-check-report.xml ./dependency-check-report-frontend.xml'
            }
        }

        // Run a Trivy file system scan and generate a report in HTML format
        stage('Trivy File System Scan') {
            steps {
                sh 'trivy fs . --format template --template @/usr/share/trivy/contrib/html.tpl > trivy-report-fs.html'
            }
        }

        // Build Docker images using Docker Compose
        stage('Docker Compose Build') {
            steps {
                sh 'docker-compose down -v'
                sh 'docker-compose build --no-cache'
            }
        }

        // Run Trivy container image scan for the used images and generate reports in HTML format
        stage('Trivy Image Scan') {
            steps {
                sh 'trivy image e2ee-real-time-chat-app-backend:latest --format template --template @/usr/share/trivy/contrib/html.tpl > trivy-report-backend.html'
                sh 'trivy image e2ee-real-time-chat-app-frontend:latest --format template --template @/usr/share/trivy/contrib/html.tpl > trivy-report-frontend.html'
                sh 'trivy image postgres:17.4-alpine3.21 --format template --template @/usr/share/trivy/contrib/html.tpl > trivy-report-postgres.html'
            }
        }

        // Run OWASP ZAP for DAST and generate a report in HTML format
        stage('OWASP ZAP (DAST)') {
            steps {
                // Ensure the current directory is writable by ZAP
                sh "chmod 777 \$(pwd)"

                // Run the application using Docker Compose for OWASP ZAP
                sh 'docker-compose up -d'

                // Create a dedicated directory for ZAP report output and set permissions
                sh """
                    mkdir -p zap-reports
                    chmod 777 zap-reports
                """

                // Run the OWASP ZAP container, outputting the report to zap-reports
                sh """
                    docker run --rm \
                    -v \$(pwd)/zap-reports:/zap/wrk/:rw \
                    --name zap \
                    -t zaproxy/zap-stable zap-baseline.py \
                    -t \$DAST_URL -I -j -r DAST-report.html
                """
            }
        }
     
        // Archive all generated security reports
        stage('Archive Reports') {
           steps {
               archiveArtifacts artifacts: 'dependency-check-report-backend.xml, dependency-check-report-frontend.xml, semgrep-output.json, sbom-root.json, backend/sbom-backend.json, frontend/sbom-frontend.json, trivy-*.html, zap-reports/DAST-report.html', onlyIfSuccessful: true
            }
        }
    }
    
    // Run final cleanup: remove Docker artifacts and reset workspace to free up space
    post {
        always {
            script {
                sh 'docker-compose down -v'
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
