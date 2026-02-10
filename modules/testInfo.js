/**
 * Custom Playwright Reporter - Affiche le statut de chaque test après son exécution
 */

class TestInfoReporter {
  onTestEnd(test, result) {
    const status = result.status;
    const title = test.title;
    const duration = result.duration;
    
    const statusEmoji = {
      'passed': '✅',
      'failed': '❌',
      'skipped': '⏭️',
      'timedOut': '⏱️'
    };

    const emoji = statusEmoji[status] || '⚪';
    const color = this.getStatusColor(status);
    const reset = '\x1b[0m';
    
    console.log(`\n${color}${emoji} [${status.toUpperCase()}] ${title} (${duration}ms)${reset}`);
    
    if (result.error) {
      console.log(`${color}   Error: ${result.error.message}${reset}`);
    }
  }

  getStatusColor(status) {
    const colors = {
      'passed': '\x1b[32m',    // Green
      'failed': '\x1b[31m',    // Red
      'skipped': '\x1b[33m',   // Yellow
      'timedOut': '\x1b[35m'   // Magenta
    };
    return colors[status] || '\x1b[0m';
  }
}

module.exports = TestInfoReporter;
