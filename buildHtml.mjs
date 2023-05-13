// @todo: Improve this function to be more user friendly and readable
export function buildHtml(req) {
  const data = req;
  var head = `
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" />
    `;

  var body = `
        <div class='container-fluid'>
            <h1 class="display-3">Welcome to spyone!</h1>
            <h2 class="display-4">
                Download your results (in json format):
                <button id='download' class='btn btn-primary'>Download</button>
            </h2>
            <canvas id="myChart"></canvas>
        </div>
        
        
        <!-- JavaScript -->
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
            const data = ${data};

            function downloadObjectAsJson(exportObj, exportName) {
                var dataStr =
                'data:text/json;charset=utf-8,' +
                encodeURIComponent(JSON.stringify(exportObj));
                var downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute('href', dataStr);
                downloadAnchorNode.setAttribute('download', exportName + '.json');
                document.body.appendChild(downloadAnchorNode); // required for firefox
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            }

            document.getElementById('download').addEventListener('click', function () {
                downloadObjectAsJson(data, 'results-repo.json');
            });   
        
            const fileData = data.map(([file,stats]) => ({
                file,
                additions: stats.additions,
                deletions: stats.deletions
            }));
            
            // Sort the files by total changes (additions + deletions)
            fileData.sort(
                (a, b) => b.additions + b.deletions - a.additions - a.deletions
            );
            
            // Create the chart data
            console.log('fileData', fileData.map((file) => file.file));
            const chartData = {
                labels: fileData.map((file) => file.file),
                datasets: [
                {
                    label: 'Additions',
                    backgroundColor: '#36a2ea',
                    borderColor: '#36a2ea',
                    borderWidth: 1,
                    data: fileData.map((file) => file.additions)
                },
                {
                    label: 'Deletions',
                    backgroundColor: '#f66384',
                    borderColor: '#f66384',
                    borderWidth: 1,
                    data: fileData.map((file) => file.deletions)
                }
                ]
            };
            
            // Create the chart
            const canvas = document.getElementById('myChart');
            
            const chart = new Chart(canvas, {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Spyone - Your Repo Bar Chart'
                          }
                    }
                },
            });
        </script>
    `;

  // Return the html page
  return (
    '<!DOCTYPE html>' +
    '<html><head>' +
    head +
    '</head><body>' +
    body +
    '</body></html>'
  );
}
