require "rails_helper"

RSpec.describe "Employees API" do
  let(:json) { response.parsed_body }
  let(:valid_attributes) do
    {
      full_name: "Ada Lovelace",
      job_title: "Software Engineer",
      country: "United Kingdom",
      department: "Engineering",
      salary: 95_000,
      email: "ada@example.com",
      hire_date: "2021-03-01"
    }
  end

  describe "GET /api/v1/employees" do
    it "returns the first page ordered by name with pagination meta" do
      create(:employee, full_name: "Charlie")
      create(:employee, full_name: "Alice")
      create(:employee, full_name: "Bob")

      get "/api/v1/employees", params: { per_page: 2 }

      expect(response).to have_http_status(:ok)
      expect(json["employees"].pluck("full_name")).to eq([ "Alice", "Bob" ])
      expect(json["meta"]).to eq("page" => 1, "per_page" => 2, "total_count" => 3, "total_pages" => 2)
    end

    it "returns the requested page" do
      create(:employee, full_name: "Alice")
      create(:employee, full_name: "Bob")

      get "/api/v1/employees", params: { page: 2, per_page: 1 }

      expect(json["employees"].pluck("full_name")).to eq([ "Bob" ])
    end

    it "uses 25 per page by default" do
      get "/api/v1/employees"

      expect(json["meta"]["per_page"]).to eq(25)
    end

    it "never returns more than 100 per page" do
      get "/api/v1/employees", params: { per_page: 10_000 }

      expect(json["meta"]["per_page"]).to eq(100)
    end

    it "searches by name and filters by country and job title" do
      create(:employee, full_name: "Ada Lovelace", country: "United Kingdom", job_title: "Engineer")
      create(:employee, full_name: "Ada Byron", country: "United Kingdom", job_title: "Researcher")
      create(:employee, full_name: "Ada Smith", country: "Canada", job_title: "Engineer")
      create(:employee, full_name: "Grace Hopper", country: "United Kingdom", job_title: "Engineer")

      get "/api/v1/employees", params: { q: "ada", country: "United Kingdom", job_title: "Engineer" }

      expect(json["employees"].pluck("full_name")).to eq([ "Ada Lovelace" ])
      expect(json["meta"]["total_count"]).to eq(1)
    end

    it "returns an empty page when nothing matches" do
      get "/api/v1/employees", params: { q: "nobody" }

      expect(json["employees"]).to eq([])
      expect(json["meta"]).to include("total_count" => 0, "total_pages" => 0)
    end
  end

  describe "GET /api/v1/employees/:id" do
    it "returns the employee" do
      employee = create(:employee, valid_attributes)

      get "/api/v1/employees/#{employee.id}"

      expect(response).to have_http_status(:ok)
      expect(json).to eq(valid_attributes.stringify_keys.merge("id" => employee.id))
    end

    it "returns 404 for an unknown id" do
      get "/api/v1/employees/0"

      expect(response).to have_http_status(:not_found)
      expect(json).to eq("error" => "Employee not found")
    end
  end

  describe "POST /api/v1/employees" do
    it "creates the employee" do
      expect {
        post "/api/v1/employees", params: { employee: valid_attributes }
      }.to change(Employee, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json).to include("full_name" => "Ada Lovelace", "salary" => 95_000)
    end

    it "returns 422 with errors keyed by field" do
      post "/api/v1/employees", params: { employee: valid_attributes.merge(full_name: "", salary: -5) }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]).to eq(
        "full_name" => [ "can't be blank" ],
        "salary" => [ "must be greater than 0" ]
      )
    end

    it "returns 400 when the employee key is missing" do
      post "/api/v1/employees", params: {}

      expect(response).to have_http_status(:bad_request)
      expect(json["error"]).to include("employee")
    end
  end

  describe "PATCH /api/v1/employees/:id" do
    let(:employee) { create(:employee, salary: 80_000) }

    it "updates the employee" do
      patch "/api/v1/employees/#{employee.id}", params: { employee: { salary: 88_000 } }

      expect(response).to have_http_status(:ok)
      expect(employee.reload.salary).to eq(88_000)
    end

    it "returns 422 for invalid changes" do
      other = create(:employee)

      patch "/api/v1/employees/#{employee.id}", params: { employee: { email: other.email } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]).to eq("email" => [ "has already been taken" ])
    end

    it "returns 404 for an unknown id" do
      patch "/api/v1/employees/0", params: { employee: { salary: 1 } }

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /api/v1/employees/:id" do
    it "deletes the employee" do
      employee = create(:employee)

      expect { delete "/api/v1/employees/#{employee.id}" }.to change(Employee, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end

    it "returns 404 for an unknown id" do
      delete "/api/v1/employees/0"

      expect(response).to have_http_status(:not_found)
    end
  end
end
