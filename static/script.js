// DOM Elements
const elements = {
    form: {
        jiraDomain: document.getElementById('jiraDomain'),
        email: document.getElementById('email'),
        apiToken: document.getElementById('apiToken'),
        accountId: document.getElementById('accountId'),
        projectKey: document.getElementById('projectKey'),
        startDate: document.getElementById('startDate'),
        endDate: document.getElementById('endDate')
    },
    buttons: {
        generateReport: document.getElementById('generateReport'),
        saveConfig: document.getElementById('saveConfig'),
        loadConfig: document.getElementById('loadConfig'),
        downloadCsv: document.getElementById('downloadCsv'),
        downloadSummary: document.getElementById('downloadSummary')
    },
    sections: {
        progress: document.getElementById('progress'),
        results: document.getElementById('results'),
        error: document.getElementById('errorDisplay')
    },
    error: {
        message: document.querySelector('.error-message'),
        details: document.querySelector('.error-details'),
        detailsContent: document.querySelector('.error-details-content'),
        toggleButton: document.querySelector('.error-toggle-details')
    },
    progressBar: document.querySelector('.progress-fill'),
    progressText: document.getElementById('progressText'),
    totalHours: document.getElementById('totalHours'),
    worklogTable: document.getElementById('worklogTable')
};

// Configuration storage key
const CONFIG_STORAGE_KEY = 'jiraHoursConfig';

// Error handling functions
function showError(message, details = '') {
    elements.error.message.textContent = message;
    elements.error.detailsContent.textContent = details;
    elements.sections.error.classList.remove('hidden');
    elements.sections.progress.classList.add('hidden');
    elements.sections.results.classList.add('hidden');
    elements.error.details.classList.add('hidden');
    elements.error.toggleButton.textContent = 'Show Technical Details';
}

function closeError() {
    elements.sections.error.classList.add('hidden');
}

function toggleErrorDetails() {
    const detailsSection = elements.error.details;
    const toggleButton = elements.error.toggleButton;
    const isHidden = detailsSection.classList.contains('hidden');
    
    detailsSection.classList.toggle('hidden');
    toggleButton.textContent = isHidden ? 'Hide Technical Details' : 'Show Technical Details';
}

// Format error details for display
function formatErrorDetails(error, response = null) {
    const details = [];
    
    if (error.stack) {
        details.push('Error Stack:', error.stack);
    }
    
    if (response) {
        details.push('\nResponse Details:');
        try {
            if (typeof response === 'string') {
                details.push(response);
            } else {
                details.push(JSON.stringify(response, null, 2));
            }
        } catch (e) {
            details.push('Unable to parse response details');
        }
    }
    
    return details.join('\n');
}

// Enhanced error handling for Jira API calls
async function fetchJiraData(url, authHeader) {
    try {
        // Extract domain and path from the full URL
        const urlObj = new URL(url);
        const domain = urlObj.host;
        const path = urlObj.pathname + urlObj.search;
        
        // Get credentials from the auth header
        const [, credentials] = authHeader.split(' ');
        const [email, apiToken] = atob(credentials).split(':');
        
        // Make request to our proxy server
        const response = await fetch('http://localhost:8000/proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                domain,
                email,
                apiToken,
                path
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            let errorMessage = data.error || 'Failed to fetch data from Jira';
            const error = new Error(errorMessage);
            error.status = response.status;
            error.details = data.details;
            throw error;
        }
        
        return data;
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            showError(
                'Unable to connect to server. Please check your internet connection.',
                formatErrorDetails(error)
            );
        } else {
            showError(
                error.message || 'An unexpected error occurred',
                error.details || formatErrorDetails(error)
            );
        }
        throw error;
    }
}

// Validate configuration before making API calls
function validateConfig(config) {
    const required = {
        'Jira Domain': config.domain,
        'Email': config.email,
        'API Token': config.apiToken,
        'User Account ID': config.accountId
    };
    
    const missing = Object.entries(required)
        .filter(([_, value]) => !value)
        .map(([key]) => key);
    
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    if (!config.domain.includes('.')) {
        throw new Error('Invalid Jira domain format. Should be something like "your-domain.atlassian.net"');
    }
    
    if (!config.email.includes('@')) {
        throw new Error('Invalid email format');
    }
    
    // Validate date range if both dates are provided
    if (config.startDate && config.endDate) {
        const start = new Date(config.startDate);
        const end = new Date(config.endDate);
        if (start > end) {
            throw new Error('Start date cannot be after end date');
        }
    }
}

// Event Listeners
elements.buttons.generateReport.addEventListener('click', generateReport);
elements.buttons.saveConfig.addEventListener('click', saveConfiguration);
elements.buttons.loadConfig.addEventListener('click', loadConfiguration);
elements.buttons.downloadCsv.addEventListener('click', () => downloadReport('detailed'));
elements.buttons.downloadSummary.addEventListener('click', () => downloadReport('summary'));
elements.error.toggleButton.addEventListener('click', toggleErrorDetails);

// Save configuration to localStorage
function saveConfiguration() {
    const config = {
        jiraDomain: elements.form.jiraDomain.value,
        email: elements.form.email.value,
        apiToken: elements.form.apiToken.value,
        accountId: elements.form.accountId.value,
        projectKey: elements.form.projectKey.value,
        startDate: elements.form.startDate.value,
        endDate: elements.form.endDate.value
    };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    alert('Configuration saved successfully!');
}

// Load configuration from localStorage
function loadConfiguration() {
    const config = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY));
    if (config) {
        Object.keys(config).forEach(key => {
            if (elements.form[key]) {
                elements.form[key].value = config[key];
            }
        });
        alert('Configuration loaded successfully!');
    } else {
        alert('No saved configuration found.');
    }
}

// Generate the authorization header
function getAuthHeader(email, apiToken) {
    return 'Basic ' + btoa(`${email}:${apiToken}`);
}

// Build JQL query
function buildJqlQuery(accountId, projectKey, startDate, endDate) {
    let query = `worklogAuthor=${accountId}`;
    if (projectKey) query += ` AND project=${projectKey}`;
    if (startDate) query += ` AND worklogDate >= '${startDate}'`;
    if (endDate) query += ` AND worklogDate <= '${endDate}'`;
    return encodeURIComponent(query);
}

// Update progress
function updateProgress(percent, text) {
    elements.progressBar.style.width = `${percent}%`;
    elements.progressText.textContent = text;
}

// Main report generation function
async function generateReport() {
    try {
        // Clear any existing errors
        closeError();
        
        // Show progress section and hide results
        elements.sections.progress.classList.remove('hidden');
        elements.sections.results.classList.add('hidden');
        
        // Get form values
        const config = {
            domain: elements.form.jiraDomain.value.trim(),
            email: elements.form.email.value.trim(),
            apiToken: elements.form.apiToken.value.trim(),
            accountId: elements.form.accountId.value.trim(),
            projectKey: elements.form.projectKey.value.trim(),
            startDate: elements.form.startDate.value,
            endDate: elements.form.endDate.value
        };

        // Validate configuration
        validateConfig(config);

        const authHeader = getAuthHeader(config.email, config.apiToken);
        const jqlQuery = buildJqlQuery(config.accountId, config.projectKey, config.startDate, config.endDate);
        
        // Fetch issues
        updateProgress(10, 'Fetching issues...');
        let startAt = 0;
        const maxResults = 50;
        let total = 1;
        let allIssues = [];
        
        while (startAt < total) {
            try {
                const response = await fetchJiraData(
                    `https://${config.domain}/rest/api/3/search?jql=${jqlQuery}&maxResults=${maxResults}&startAt=${startAt}`,
                    authHeader
                );
                
                total = response.total;
                allIssues = allIssues.concat(response.issues);
                startAt += maxResults;
                
                const progress = Math.min((startAt / total) * 50, 50);
                updateProgress(progress, `Retrieved ${allIssues.length} of ${total} issues...`);
            } catch (error) {
                // If we've already fetched some issues, we can try to continue with what we have
                if (allIssues.length > 0) {
                    console.warn('Error fetching all issues, continuing with partial data:', error);
                    break;
                }
                throw error;
            }
        }

        if (allIssues.length === 0) {
            showError('No issues found matching the specified criteria. Please check your filters and try again.');
            return;
        }

        // Process worklogs
        updateProgress(50, 'Fetching worklog details...');
        const worklogs = [];
        let processedIssues = 0;
        let errors = [];
        
        for (const issue of allIssues) {
            try {
                const worklogResponse = await fetchJiraData(
                    `https://${config.domain}/rest/api/3/issue/${issue.key}/worklog`,
                    authHeader
                );
                
                for (const worklog of worklogResponse.worklogs) {
                    if (worklog.author.accountId === config.accountId) {
                        worklogs.push({
                            issueKey: issue.key,
                            issueLink: `https://${config.domain}/browse/${issue.key}`,
                            summary: issue.fields.summary,
                            date: worklog.started.substring(0, 10),
                            hours: worklog.timeSpentSeconds / 3600,
                            comment: worklog.comment?.content?.[0]?.content?.[0]?.text || 'No comment'
                        });
                    }
                }
            } catch (error) {
                errors.push(`Failed to fetch worklogs for ${issue.key}: ${error.message}`);
                continue;
            }
            
            processedIssues++;
            const progress = 50 + (processedIssues / allIssues.length) * 50;
            updateProgress(progress, `Processing issue ${processedIssues} of ${allIssues.length}...`);
        }

        if (worklogs.length === 0) {
            if (errors.length > 0) {
                showError(
                    'Failed to retrieve any work logs.',
                    'Errors encountered:\n' + errors.join('\n')
                );
            } else {
                showError('No work logs found for the specified user and time period.');
            }
            return;
        }

        if (errors.length > 0) {
            console.warn('Some worklogs could not be fetched:', errors);
        }

        // Sort worklogs by date
        worklogs.sort((a, b) => a.date.localeCompare(b.date));

        // Calculate total hours
        const totalHours = worklogs.reduce((sum, log) => sum + log.hours, 0);
        elements.totalHours.textContent = `Total Hours: ${totalHours.toFixed(2)}`;

        // Generate summary data
        window.summaryData = worklogs.reduce((acc, log) => {
            if (!acc[log.date]) {
                acc[log.date] = 0;
            }
            acc[log.date] += log.hours;
            return acc;
        }, {});

        // Store worklog data for downloads
        window.worklogData = worklogs;

        // Update table
        const tbody = elements.worklogTable.querySelector('tbody');
        tbody.innerHTML = worklogs.map(log => `
            <tr>
                <td><a href="${log.issueLink}" target="_blank">${log.issueKey}</a></td>
                <td>${log.summary}</td>
                <td>${log.date}</td>
                <td>${log.hours.toFixed(2)}</td>
                <td>${log.comment}</td>
            </tr>
        `).join('');

        // Show results
        updateProgress(100, errors.length > 0 ? 
            `Report generated with some errors (${errors.length} issues affected)` : 
            'Report generated successfully!');
        elements.sections.results.classList.remove('hidden');

    } catch (error) {
        showError(
            error.message || 'An unexpected error occurred while generating the report',
            formatErrorDetails(error)
        );
    }
}

// Download report as CSV
function downloadReport(type) {
    if (!window.worklogData) {
        alert('No report data available. Please generate a report first.');
        return;
    }

    let csvContent, filename;
    
    if (type === 'detailed') {
        // Detailed report
        csvContent = 'Issue Key,Issue Summary,Date,Hours Logged,Comment,Issue Link\n';
        csvContent += window.worklogData.map(log => 
            `${log.issueKey},"${log.summary.replace(/"/g, '""')}",${log.date},${log.hours.toFixed(2)},"${log.comment.replace(/"/g, '""')}","${log.issueLink}"`
        ).join('\n');
        filename = 'worklog_report.csv';
    } else {
        // Summary report
        csvContent = 'Date,Total Hours\n';
        csvContent += Object.entries(window.summaryData)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, hours]) => `${date},${hours.toFixed(2)}`)
            .join('\n');
        filename = 'summary_worklog_report.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
