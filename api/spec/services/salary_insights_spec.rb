require "rails_helper"

RSpec.describe SalaryInsights do
  subject(:insights) { described_class.new }

  def add(country, job_title, *salaries)
    salaries.each { |salary| create(:employee, country:, job_title:, salary:) }
  end

  context "with employees in two countries" do
    before do
      add "Germany", "Engineer", 60_000, 70_000, 95_000
      add "Germany", "Analyst", 50_000
      add "India", "Engineer", 30_000, 41_000
    end

    it "summarises the whole organisation" do
      expect(insights.summary).to eq(
        headcount: 6,
        min_salary: 30_000,
        max_salary: 95_000,
        average_salary: 57_667,
        median_salary: 55_000,
        total_payroll: 346_000,
        country_count: 2
      )
    end

    it "compares countries in alphabetical order" do
      expect(insights.countries).to eq([
        { country: "Germany", headcount: 4, min_salary: 50_000, max_salary: 95_000,
          average_salary: 68_750, median_salary: 65_000, total_payroll: 275_000 },
        { country: "India", headcount: 2, min_salary: 30_000, max_salary: 41_000,
          average_salary: 35_500, median_salary: 35_500, total_payroll: 71_000 }
      ])
    end

    it "gives min, max and average for one country with a job title breakdown" do
      expect(insights.country("Germany")).to eq(
        country: "Germany",
        headcount: 4,
        min_salary: 50_000,
        max_salary: 95_000,
        average_salary: 68_750,
        median_salary: 65_000,
        total_payroll: 275_000,
        job_titles: [
          { job_title: "Analyst", headcount: 1, min_salary: 50_000, max_salary: 50_000,
            average_salary: 50_000, median_salary: 50_000, total_payroll: 50_000 },
          { job_title: "Engineer", headcount: 3, min_salary: 60_000, max_salary: 95_000,
            average_salary: 75_000, median_salary: 70_000, total_payroll: 225_000 }
        ]
      )
    end

    it "gives the average for a job title in a country with its comparisons" do
      expect(insights.job_title(country: "Germany", job_title: "Engineer")).to eq(
        country: "Germany",
        job_title: "Engineer",
        headcount: 3,
        min_salary: 60_000,
        max_salary: 95_000,
        average_salary: 75_000,
        median_salary: 70_000,
        total_payroll: 225_000,
        country_average_salary: 68_750,
        global_average_salary: 59_200
      )
    end

    it "returns zero headcount and no figures for a country without employees" do
      expect(insights.country("Canada")).to eq(
        country: "Canada",
        headcount: 0,
        min_salary: nil,
        max_salary: nil,
        average_salary: nil,
        median_salary: nil,
        total_payroll: nil,
        job_titles: []
      )
    end

    it "returns zero headcount for a job title that is not used in the country" do
      expect(insights.job_title(country: "India", job_title: "Analyst")).to include(
        headcount: 0,
        average_salary: nil,
        country_average_salary: 35_500,
        global_average_salary: 50_000
      )
    end
  end

  it "rounds averages and medians to the nearest dollar" do
    add "France", "Designer", 50_000, 50_001

    expect(insights.country("France")).to include(average_salary: 50_001, median_salary: 50_001)
  end
end
