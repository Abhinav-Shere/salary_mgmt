require "rails_helper"

RSpec.describe "Insights API" do
  let(:json) { response.parsed_body }

  before do
    create(:employee, country: "India", job_title: "Engineer", salary: 30_000)
    create(:employee, country: "India", job_title: "Engineer", salary: 40_000)
    create(:employee, country: "Germany", job_title: "Engineer", salary: 80_000)
  end

  it "GET /api/v1/insights/summary returns organisation figures" do
    get "/api/v1/insights/summary"

    expect(response).to have_http_status(:ok)
    expect(json).to include("headcount" => 3, "average_salary" => 50_000, "country_count" => 2)
  end

  it "GET /api/v1/insights/countries returns one row per country" do
    get "/api/v1/insights/countries"

    expect(json["countries"].pluck("country", "headcount")).to eq([ [ "Germany", 1 ], [ "India", 2 ] ])
  end

  it "GET /api/v1/insights/country returns min, max and average for the country" do
    get "/api/v1/insights/country", params: { country: "India" }

    expect(json).to include("min_salary" => 30_000, "max_salary" => 40_000, "average_salary" => 35_000)
    expect(json["job_titles"].pluck("job_title")).to eq([ "Engineer" ])
  end

  it "GET /api/v1/insights/job_title returns the title average in the country" do
    get "/api/v1/insights/job_title", params: { country: "India", job_title: "Engineer" }

    expect(json).to include("average_salary" => 35_000, "global_average_salary" => 50_000)
  end

  it "returns 400 when a required parameter is missing" do
    get "/api/v1/insights/job_title", params: { country: "India" }

    expect(response).to have_http_status(:bad_request)
    expect(json["error"]).to include("job_title")
  end
end
