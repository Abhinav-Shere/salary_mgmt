require "rails_helper"

RSpec.describe "Lookups API" do
  it "returns the allowed countries and departments and the job titles in use" do
    create(:employee, job_title: "Data Analyst")
    create(:employee, job_title: "Accountant")
    create(:employee, job_title: "Data Analyst")

    get "/api/v1/lookups"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq(
      "countries" => Employee::COUNTRIES,
      "departments" => Employee::DEPARTMENTS,
      "job_titles" => [ "Accountant", "Data Analyst" ]
    )
  end
end
