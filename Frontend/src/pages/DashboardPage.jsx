import React, { Component } from "react";
import { contributionService } from "../services/contributionService";
import { groupService } from "../services/groupService";
import { loanService } from "../services/loanService";
import { memberService } from "../services/memberService";

class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stats: {
        totalMembers: 0,
        totalGroups: 0,
        totalContributions: 0,
        totalLoans: 0,
        recentMembers: []
      },
      loading: true,
      error: null
    };
  }

  componentDidMount() {
    this.fetchDashboardData();
  }

  fetchDashboardData = async () => {
    try {
      this.setState({ loading: true, error: null });
      
      const [membersRes, groupsRes, contributionsRes, loansRes] = await Promise.all([
        memberService.getAllMembers(),
        groupService.getAllGroups(),
        contributionService.getAllContributions(),
        loanService.getAllLoans()
      ]);

      const members = membersRes.data || [];
      const groups = groupsRes.data || [];
      const contributions = contributionsRes.data || [];
      const loans = loansRes.data || [];

      this.setState({
        stats: {
          totalMembers: members.length,
          totalGroups: groups.length,
          totalContributions: contributions.length,
          totalLoans: loans.length,
          recentMembers: members.slice(0, 5)
        },
        loading: false
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      this.setState({ 
        loading: false, 
        error: "Failed to load dashboard data." 
      });
    }
  };

  render() {
    const { stats, loading, error } = this.state;

    if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>;
    if (error) return <div style={{ padding: "40px", textAlign: "center", color: "red" }}>{error}</div>;

    return (
      <div style={{ padding: "20px" }}>
        <h1>Dashboard</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
          <div style={{ padding: "20px", backgroundColor: "#007bff", color: "white", borderRadius: "8px" }}>
            <h3>Total Members</h3>
            <p style={{ fontSize: "32px" }}>{stats.totalMembers}</p>
          </div>
          <div style={{ padding: "20px", backgroundColor: "#28a745", color: "white", borderRadius: "8px" }}>
            <h3>Total Groups</h3>
            <p style={{ fontSize: "32px" }}>{stats.totalGroups}</p>
          </div>
          <div style={{ padding: "20px", backgroundColor: "#ffc107", color: "#333", borderRadius: "8px" }}>
            <h3>Total Contributions</h3>
            <p style={{ fontSize: "32px" }}>{stats.totalContributions}</p>
          </div>
          <div style={{ padding: "20px", backgroundColor: "#dc3545", color: "white", borderRadius: "8px" }}>
            <h3>Total Loans</h3>
            <p style={{ fontSize: "32px" }}>{stats.totalLoans}</p>
          </div>
        </div>
      </div>
    );
  }
}

export default DashboardPage;
