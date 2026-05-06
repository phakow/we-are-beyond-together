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
      loading: true
    };
  }

  componentDidMount() {
    this.fetchDashboardData();
  }

  fetchDashboardData = async () => {
    try {
      this.setState({ loading: true });
      
      // Fetch all data in parallel
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
      this.setState({ loading: false });
    }
  };

  renderStatCard(title, value, color) {
    return (
      <div style={{
        padding: "20px",
        backgroundColor: color,
        color: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>{title}</h3>
        <p style={{ margin: "0", fontSize: "36px", fontWeight: "bold" }}>{value}</p>
      </div>
    );
  }

  render() {
    const { stats, loading } = this.state;

    if (loading) {
      return (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <p>Loading dashboard data...</p>
        </div>
      );
    }

    return (
      <div style={{ padding: "20px" }}>
        <h1 style={{ marginBottom: "20px" }}>Dashboard</h1>
        
        {/* Stats Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          {this.renderStatCard("Total Members", stats.totalMembers, "#007bff")}
          {this.renderStatCard("Total Groups", stats.totalGroups, "#28a745")}
          {this.renderStatCard("Total Contributions", stats.totalContributions, "#ffc107")}
          {this.renderStatCard("Total Loans", stats.totalLoans, "#dc3545")}
        </div>

        {/* Recent Members */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h2 style={{ marginBottom: "15px" }}>Recent Members</h2>
          {stats.recentMembers.length === 0 ? (
            <p>No members found.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <th style={{ padding: "10px", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "10px", textAlign: "left" }}>Group</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentMembers.map((member) => (
                  <tr key={member.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "10px" }}>{member.name}</td>
                    <td style={{ padding: "10px" }}>{member.email}</td>
                    <td style={{ padding: "10px" }}>{member.group_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }
}

export default DashboardPage;
