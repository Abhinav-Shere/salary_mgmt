require "rails_helper"

RSpec.describe "API endpoints" do
  %w[/ /api /api/v1].each do |path|
    it "lists the API endpoints as JSON at #{path}" do
      get path

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["endpoints"]).to include(
        "GET /api/v1/employees",
        "POST /api/v1/employees",
        "GET /api/v1/insights/country"
      )
    end
  end

  it "answers unknown paths with a JSON 404" do
    delete "/api/v1/nothing-here"

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body).to eq("error" => "No route matches DELETE /api/v1/nothing-here")
  end
end
