import 'chart.js/auto';

const ReportesBI = () => {

  return (
    <div className="container mt-5">
      <h2 className="text-center">Reportes del Restaurante</h2>

      
      <div className="row mt-4">
        <div className="col-md-12">
          <h4 className="text-center">Panel de Power BI</h4>
          <iframe 
            title="Power BI Report"
            width="100%"
            height="600px"
            src="https://app.powerbi.com/view?r=eyJrIjoiZDRiZWZlNzUtMDgxYi00MGE0LWIzNTctODkwODgxODM1YWE1IiwidCI6IjM4YTFlMGExLWI2YjEtNDJlOS1iM2E5LTU5NzYyNjY3MGIxNyIsImMiOjR9"
            allowFullScreen>
          </iframe>
        </div>
      </div>
      </div>
  );
};

export default ReportesBI;
